const apiUrl = 'http://phondr.com:3141/api/';
const myCountry = 'NL';
var myLicense = getMyPlateNumberFromStorage();
var myScore = 0;
var myRank = 0;

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  onDeviceReady: function() {
    StatusBar.overlaysWebView(false);
    StatusBar.styleDefault();
    loadMain();
    showLocation();
  },
};

function loadMain() {
  $('#content').load('main.html', () => {
    const hash = window.localStorage.getItem("hash");
    if (hash && hash.length === 31) {
      hide('myPlateNumberForm');
      setMyPlateInHeader(myLicense);
      retrieveAndSetScore();
    } else {
      show('myPlateNumberForm');
      hide('main');
    }
    
    $('input').keypress(preventNonAlphaNumericCharacters);
    $('#like').on('click', thumbsUpButtonOnclick);
    $('#dislike').on('click', thumbsDownButtonOnclick);
    $('#save').on('click', saveMyPlateNumber);
    $('#rankingButton').on('click', event => showRanking());
  });
}

function preventNonAlphaNumericCharacters(e) {
  var regex = new RegExp("^[a-zA-Z0-9]$");
  var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
  if (!regex.test(key)) {
     event.preventDefault();
     return false
  }
}

function retrieveAndSetScore() {
  const path = apiUrl + 'score/' + 'NL/' + myLicense;
  fetch(path).then(function(response) {
    response.json().then(function(json) {
      myScore = json.result.score;
      myRank = json.result.rank;
      
      const smile = myScore > 0 ? 'smile' : myScore < 0 ? 'frown' : 'meh';
      
      document.getElementById('score').innerHTML = String(calculateScore(myScore));
      document.getElementById('smile').innerHTML = `<i class="fa fa-${smile}-o" aria-hidden="true"></i>`;
      document.getElementById('rank').innerHTML = String(myRank);
    });
  }, function(error) {
    showError(error.message);
  }); 
}

function calculateScore(score) {
  return Math.round(score * 100);
}

function thumbsUpButtonOnclick() {
  const validatationError = validateInput();
  if (!validatationError) sendThumb('up');
  else setMessage(validatationError);
}

function thumbsDownButtonOnclick() {
  const validatationError = validateInput();
  if (!validatationError) sendThumb('down');
  else setMessage(validatationError);
}

function sendThumb(type) {
  const license = document.getElementById('plateNumber');
  if (license.value.toLocaleUpperCase() === myLicense) {
    setMessage('Personal feedback?!?');
    return;
  }

  fetch(`${apiUrl}thumbs${type}`, {
    method: "POST",
    body: JSON.stringify({
      "hash": window.localStorage.getItem('hash'),
      "country": 'NL',
      "license": license.value
    }),
    headers: { "Content-Type": "application/json" }
  }).then(function(response) {
    response.json().then(function(json) {
      if (json.error) showError(`Error: ${json.message}`);
      else {
        setMessage('Thanks for the feedback!');
        retrieveAndSetScore();          
      }
    });
    license.value = '';
  }, function(error) {
    showError(error.message);
  });
}

function saveMyPlateNumber() {
  const data = getMyPlateNumberFromForm();
  if (!data.error) {
    myLicense = data.plate.toLocaleUpperCase();
    window.localStorage.setItem("myPlateNumber", myLicense);
    window.localStorage.setItem("hash", generateHash());
    setMyPlateInHeader();
    hide('myPlateNumberForm');
    show('main');
    retrieveAndSetScore();
  }
  else setStatus(data.error);
}

function validateInput() {
  let error = false;
  const plateNumber = document.getElementById('plateNumber').value;
  if (plateNumber.length <= 0) {
    error = 'Missing platenumber';
  }
  return error;
}

function getMyPlateNumberFromForm() {
  let result = {
    plate: '',
    error: false
  };
  const plateNumber = document.getElementById('myPlateNumber').value;
  if (plateNumber.length <= 0) result.error = 'Missing platenumber';
  else result.plate = plateNumber;

  return result;
}

function getMyPlateNumberFromStorage() {
  const license = window.localStorage.getItem('myPlateNumber');
  if (license) return license.toLocaleUpperCase();
  else return false;
}

function showError(message) {
  let errorView =  $('<div/>').attr("id", "error").addClass("error");
  let text = $('<div/>').attr("id", "errorText").text('You have encountered an issue that caused an error to happen. Please restart app and try again...');
  let icon = $('<i/>').attr("id", "errorIcon").attr('aria-hidden', true).addClass('fa fa-exclamation-triangle fa-3x');
  let closeBtn = $('<i/>').attr("id", "errorClose").attr('aria-hidden', true).addClass('fa fa-times fa-3x');
  let messageSpan = $('<div/>').attr("id", "errorMessage").text(`Error: ${message}`);

  errorView.append(icon);
  errorView.append(text);
  errorView.append(messageSpan);
  errorView.append(closeBtn);

  closeBtn.on('click', function() {
    errorView.remove();
  });

  $('body').append(errorView);  
}

function setMessage(message) {
  document.getElementById('message').innerHTML = message;  
}

function setMyPlateInHeader() {
  document.getElementById('me').innerHTML = myLicense.toUpperCase();
}

function show(id) {
  document.getElementById(id).style.display = '';
}

function hide(id) {
  document.getElementById(id).style.display = 'none';
}

function generateHash() {
  return 'xxxxxxxxxxxxxxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function drawRankingTable(top10, bottom10, searchData) {
  const maxRank = bottom10[0].rank;
  
  var createRow = (row, type) => {
    let icon = '';
    if (row.rank === 1) {
      icon = '<i class="fa fa-smile-o" aria-hidden="true"></i>';
    } else if (row.rank === maxRank) {
      icon = '<i class="fa fa-frown-o" aria-hidden="true"></i>';
    }
    
    if (row.country === myCountry && row.license === myLicense) {
      type = 'self';
    } else if (searchData && row.country === searchData.country && row.license === searchData.license) {
      type = 'search';
    }
    
    return `
              <tr class="${type}">
                <td>${icon}</td>
                <td>${row.rank}</td>
                <td><div class="licensePlate">
                  <span>${row.country}</span><span>&#8226;</span><span>${row.license}</span>
                </div></td>
                <td>${calculateScore(row.score)}</td>
              </tr>
          `;
  };
  
  var createSpacer = () => {
    return '<tr class="spacer"><td></td><td><i class="fa fa-ellipsis-v" aria-hidden="true"></i><td></td><td></td></tr>';
  };
  
  var appendSelfRow = function () {
    if (myRank > 10 && myRank < maxRank - 9) {
      $('#rankingTable').append(createRow({
        country: myCountry,
        license: myLicense,
        score: myScore,
        rank: myRank
      }, 'self'));
      
      $('#rankingTable').append(createSpacer());
    }
  };
  
  var appendSearchRow = function () {
    if (searchData.rank > 10 && searchData.rank < maxRank - 9) {
      $('#rankingTable').append(createRow(searchData, 'search'));
      
      $('#rankingTable').append(createSpacer());
    }
  };
  
  $('#rankingTable').empty();
  
  top10.forEach((row) => {
    $('#rankingTable').append(createRow(row, 'top'));
  });
  
  $('#rankingTable').append(createSpacer());
  
  if (searchData && (searchData.country !== myCountry || searchData.license !== myLicense)) {
    if (myRank > searchData.rank) {
      appendSearchRow();
      appendSelfRow();
    } else {
      appendSelfRow();
      appendSearchRow();
    }
  } else {
    appendSelfRow();
  }
  
  bottom10.reverse().forEach((row) => {
    if (row.rank > myRank) {
      $('#rankingTable').append(createRow(row, 'bottom'));
    }
  });
  
  // if (searchData) {
  //   $('.search')[0].scrollIntoView();
  // }
}

function showRanking(search) {
  let requests = [
    new Promise((resolve) => {
      $('#content').load('ranking.html', () => {
        resolve();
      });
    }),
    fetch(`${apiUrl}top10/`),
    fetch(`${apiUrl}bottom10/`),
  ];
  
  if (search) {
    requests.push(fetch(`${apiUrl}score/${myCountry}/${search}`));
  }
  
  Promise.all(requests)
      .then(responses => {
        $('#back').on('click', loadMain);
        $('#searchButton').on('click', () => {
          const $searchInput = $('#searchInput');
          $searchInput.toggleClass('_hidden');
          $searchInput.children('input').focus();
        });
        $('#searchInput').children('input').on('keypress', event => {
          if (event.keyCode === 13) {
            const $searchInput = $('#searchInput');
            $searchInput.addClass('_hidden');
            showRanking($searchInput.children('input').val());
          }
        });
        
        let responseData = [
          responses[1].json(),
          responses[2].json()
        ];
        
        if (search) {
          responseData.push(responses[3].json());
        }

        return Promise.all(responseData);
      })
      .then(data => {
        drawRankingTable(data[0].result, data[1].result, search && {
          country: myCountry.toLocaleUpperCase(),
          license: search.toLocaleUpperCase(),
          score: data[2].result.score,
          rank: data[2].result.rank
        });
      });
}

function showLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function succes(result) {
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${result.coords.latitude},${result.coords.longitude}&key=AIzaSyDVqRsZXDOS1MC9BGjd_JbZXkFk1b5rOoM`).then(function(response) {
        response.json().then(function(json) {
          json.results[0].address_components.forEach(function(item) {
            if (item.types[0] === "country") setMessage('Location: ' + item.short_name);
          })
        });
      }, function(error) {
        showError(error.message);
      }); 
    }, function(error) {
      showError('PositionError.code:' + error.code);
    });
  } else {
    showError('nav.geo missing');
  }
}
