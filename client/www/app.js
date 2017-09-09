const apiUrl = 'http://phondr.com:3141/api/';
var myCountry = window.localStorage.getItem('myCountry') || 'NL';
var myLicense = (window.localStorage.getItem('myPlateNumber') || '').toLocaleUpperCase();
var myScore = 0;
var myRank = 0;
let selectedCountry = myCountry;
const sounds = {
  thumbsup: new Audio('static/chime_done.wav'),
  thumbsdown: new Audio('static/chime_dim.wav')
};

let countries;
$.getJSON('static/countries.json', c => {
  countries = c;
});

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
    $('#feedback').hide();
    
    const key = window.localStorage.getItem('key');
    if (!key || key.length !== 32) {
      $('.main').hide();
      
      getCountry(country => {
        if (country.error) {
          return showError(country.error);
        }
        
        selectedCountry = country;
        populateCountrySelect();
        $('#loader').hide();
      });
    } else {
      $('.setup').hide();
      $('#loader').hide();
      setMyPlateInHeader(myLicense);
      retrieveAndSetScore();
    }
    
    populateCountrySelect();
    $('#like').on('click', thumbsUpButtonOnclick);
    $('#dislike').on('click', thumbsDownButtonOnclick);
    $('#save').on('click', saveMySettings);
    $('#rankingButton').on('click', event => showRanking());
    $('#plateNumber').html(createLicensePlate(selectedCountry, '', true, true));
    $('#selectCountry').on('change', event => {
      selectedCountry = $(event.target).val();
      $('#plateNumber').html(createLicensePlate(selectedCountry, '', true, true));
      $('#searchInput').html(createLicensePlate(selectedCountry, '', true));
    });
    $('input').on('keypress', preventNonAlphaNumericCharacters);
  });
}

function populateCountrySelect() {
  _(countries).map((country, key) => Object.assign(country, {key})).sortBy('name').each(country => {
    const selected = (country.key === selectedCountry) ? 'selected' : '';
    $('#selectCountry').append(`<option value="${country.key}" ${selected}>${country.name} (${country.key})</option>`);
  });
}

function preventNonAlphaNumericCharacters(event) {
  var key = String.fromCharCode(event.charCode || event.which);
  if (!/^[a-zA-Z0-9]$/.test(key)) {
    event.preventDefault();
    return false
  }
}

function retrieveAndSetScore() {
  fetch(`${apiUrl}score/${myCountry}/${myLicense}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`${response.url}: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(json => {
        if (json.error) {
          return setMessage(json.message);
        }
        
        myScore = json.result.score;
        myRank = json.result.rank;
        
        const smile = myScore > 0 ? 'smile' : myScore < 0 ? 'frown' : 'meh';
        
        document.getElementById('score').innerHTML = String(calculateScore(myScore));
        document.getElementById('smile').innerHTML = `<i class="fa fa-${smile}-o" aria-hidden="true"></i>`;
        document.getElementById('rank').innerHTML = String(myRank);
      })
      .catch(error => {
        showError(error);
      });
}

function calculateScore(score) {
  return Math.round(score * 100);
}

function thumbsUpButtonOnclick() {
  const validatationError = validateInput();
  if (!validatationError) sendThumb(true);
  else setMessage(validatationError);
}

function thumbsDownButtonOnclick() {
  const validatationError = validateInput();
  if (!validatationError) sendThumb(false);
  else setMessage(validatationError);
}

function sendThumb(isUp) {
  const license = $('#plateNumber input').val();
  if (license.toLocaleUpperCase() === myLicense && selectedCountry === myCountry) {
    setMessage('Personal feedback?!?');
    return;
  }
  
  if (isValidCountryLenght(selectedCountry)) {
    showError('No country selected, is this possible?');
    return;
  }
  
  getLocation(location => {
    const thumb = `thumbs${isUp ? 'up' : 'down'}`;
    fetch(`${apiUrl}${thumb}`, {
      method: 'POST',
      body: JSON.stringify({
        hash: window.localStorage.getItem('key'),
        country: selectedCountry,
        license: license,
        location: {
          lat: location.latitude,
          lng: location.longitude
        }
      }),
      headers: {'Content-Type': 'application/json'}
    }).then(function(response) {
      response.json().then(function(json) {
        if (json.error) {
          setMessage(json.message);
        } else {
          showFeedback(thumb);
          sounds[thumb].play();
          setMessage('Thanks for the feedback!');
          retrieveAndSetScore();
        }
      });
      $('#plateNumber input').val('');
    }, function(error) {
      showError(error.message);
    });
  });
}

function showFeedback(which) {
  $('#feedback').show();
  const image = $(`#${which}Feedback > img`);
  image.animate({width: '100vw', height: '100vw'}, 250, () => {
    image.animate({width: 0, height: 0}, 250, () => {
      $('#feedback').hide();
    });
  });
}

function saveMySettings() {
  const license = $('#plateNumber input').val();
  
  if (license.length < 1 || license.length > 9) {
    return setMessage('Type a license');
  }
  
  myCountry = selectedCountry;
  myLicense = license.toLocaleUpperCase();
  
  window.localStorage.setItem('myPlateNumber', myLicense);
  window.localStorage.setItem('myCountry', myCountry);
  window.localStorage.setItem('key', generateKey());
  
  loadMain();
}

function isValidCountryLenght(country) {
  return country.length < 1 || country.length > 4;
}

function validateInput() {
  let error = false;
  const plateNumber = $('#plateNumber input').val();
  if (plateNumber.length <= 0) {
    error = 'Missing plate number';
  }
  return error;
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
  $('#message').text(message).show();
}

function setMyPlateInHeader() {
  $('#me').html(createLicensePlate(myCountry, myLicense));
}

function generateKey() {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => {
    return (Math.random() * 16 | 0).toString(16);
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
                <td>${createLicensePlate(row.country, row.license)}</td>
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
    $('#rankingTable').append(createRow(row, 'bottom'));
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
    requests.push(fetch(`${apiUrl}score/${selectedCountry}/${search}`));
  }
  
  Promise.all(requests)
      .then(responses => {
        $('#back').on('click', loadMain);
        $('#searchButton').on('click', () => {
          $('#searchContainer').toggleClass('_hidden');
          $('#searchInput input').focus();
          $('#rankingTitle h1').toggleClass('_hidden');
        });
        $('#searchInput').html(createLicensePlate(selectedCountry, '', true));
        
        var doSearch = () => {
          $('#searchContainer').addClass('_hidden');
          $('#rankingTitle h1').removeClass('_hidden');
          showRanking($('#searchInput input').val());
        };
        
        $('#searchInput input').on('keypress', event => {
          if (event.keyCode === 13) {
            doSearch();
          }
        });
        $('#searchGo').on('click', doSearch);
        
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
              country: selectedCountry.toLocaleUpperCase(),
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
            if (item.types[0] === 'country') {
              let country = item.short_name;
              
              // Need to check both code and name, because not all license plate codes match
              // For example Belgium is country BE and license B. Matches on Belgium instead
              if (!countries[country]) {
                country = _.findKey(countries, {name: item.long_name});
              }
              
              if (!country) {
                return callback({error: 'getCountry error: no match found'});
              }
              
              callback(country);
            }
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
    }
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
    }, function (error) {
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

function createLicensePlate(country, license, isInput, isLarge) {
  const countryData = countries[country];
  let style = '';
  let inputStyle = '';
  const shadowWidth = isLarge ? 2 : 1;
  
  if (countryData && countryData.fg && countryData.bg) {
    style = `background:${countryData.bg};color:${countryData.fg};box-shadow: 0 0 0 ${shadowWidth}px ${countryData.bg};border-color:${countryData.fg}`;
    inputStyle = `color:${countryData.fg};`;
  }
  
  const licensePart = isInput ?
      `<input maxlength="9" placeholder="A1234BC" style="${inputStyle}" onfocus="javascript:$(this).attr('placeholder', '')" onblur="javascript:$(this).attr('placeholder', 'A1234BC')">${license}</input>` :
      `<span>${license}</span>`;
  
  return `
      <div class="licensePlate${isInput ? ' _input' : ''}${isLarge ? ' _large' : ''}" style="${style}">
        <span>${country}</span>${licensePart}
        ${isInput ? `<div class="clickBox" onclick="openSelect($('#selectCountry'))"></div>` : ''}
      </div>
  `;
}

function openSelect($select) {
  if (document.createEvent) {
    var e = document.createEvent('MouseEvents');
    e.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    $select[0].dispatchEvent(e);
  } else if (element.fireEvent) {
    $select[0].fireEvent('onmousedown');
  }
}