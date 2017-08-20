const apiUrl = 'http://phondr.com:3141/api/';
var myCountry = window.localStorage.getItem('myCountry') | 'NL';
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
  },
};

function loadMain() {
  $('#content').load('main.html', () => {
    $('#myPlateNumberForm').hide();
    $('#main').hide();
    $('#buttons').hide();
    const hash = window.localStorage.getItem("hash");
    if (hash && hash.length === 31) {
      // Main screen
      $('#loader').hide();      
      $('#main').show();
      $('#buttons').show();
      setMyPlateInHeader(myLicense);
      retrieveAndSetScore();
    } else {
      // Get user info screen
      getCountry(function(country) {
        if (!country.error) {
          populateCountrySelect(country);
          $('#loader').hide();
          $('#myPlateNumberForm').show();
        }
        else showError(country.error);
      });      
    }
    
    $('input').keypress(preventNonAlphaNumericCharacters);
    $('#like').on('click', thumbsUpButtonOnclick);
    $('#dislike').on('click', thumbsDownButtonOnclick);
    $('#save').on('click', saveMySettings);
    $('#rankingButton').on('click', event => showRanking());
  });
}

function populateCountrySelect(country) {
  $.getJSON('countries.json', function(data) {
    $.each(data, function(key, val) {
      $('#country').append($('<option/>').attr("value", key).text(`${val} (${key})`));
      if (key === country.code || val === country.name) {
        // Need to check both code and name, because not all license plate codes match
        // For example Belgium is country BE and license B. Matches on Belgium instead
        $(`#country option[value='${key}']`).prop('selected', true);
      }
    })
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
  const path = `${apiUrl}score/${myCountry}/${myLicense}`;
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
      "country": myCountry,
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

function saveMySettings() {
  const license = $('#myPlateNumber').val();
  if (license.length < 1 || license.length > 9) {
    setMessage('Type a license');
    return;
  }

  const country = $('#country').val();
  if (country.length < 1 || country.length > 4) {
    setMessage('Select a country');
    return
  }

  myLicense = license.toLocaleUpperCase();
  myCountry = country;
  window.localStorage.setItem("myPlateNumber", myLicense);
  window.localStorage.setItem("myCountry", country);
  window.localStorage.setItem("hash", generateHash());
  setMyPlateInHeader();
  $('#myPlateNumberForm').hide();
  $('#main').show();
  $('#buttons').show();    
  retrieveAndSetScore();
}

function validateInput() {
  let error = false;
  const plateNumber = document.getElementById('plateNumber').value;
  if (plateNumber.length <= 0) {
    error = 'Missing platenumber';
  }
  return error;
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

function getCountry(callback) {
  getLocation(function(location) {
    if (!location.error) {
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyDVqRsZXDOS1MC9BGjd_JbZXkFk1b5rOoM`).then(function(response) {
        response.json().then(function(json) {
          json.results[0].address_components.forEach(function(item) {
            if (item.types[0] === "country") callback({
              code: item.short_name.toLocaleUpperCase(),
              name: item.long_name
            });
          })
        });
      }, function(error) {
        callback({
          error: `getCountry fetch error: ${error.message}`
        })
      });
    } else {
      callback({
        error: `getLocation error: ${location.error}`
      })
    };
  });
}

function getLocation(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function succes(result) {
      callback({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        error: false
      })
    }, function(error) {
      callback({
        error: error.code
      })
    });
  } else {
    callback({
      error: 'nav.geo missing'
    })
  }      
}
