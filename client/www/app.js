const apiUrl = 'http://phondr.com:3000/api/';
const myCountry = 'NL';
var myLicense = window.localStorage.getItem('myPlateNumber').toLocaleUpperCase();

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  onDeviceReady: function() {
    StatusBar.overlaysWebView(false);
    StatusBar.backgroundColorByName("lightGray");
    StatusBar.styleDefault();
    loadMain();
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
    
    document.getElementById('like').onclick = thumbsUpButtonOnclick;
    document.getElementById('dislike').onclick = thumbsDownButtonOnclick;
    document.getElementById('save').onclick = saveMyPlateNumber;
    $('#rankingButton').on('click', showRanking);
  });
}

function retrieveAndSetScore() {
  const path = apiUrl + 'score/' + 'NL/' + myLicense;
  fetch(path).then(function(response) {
    response.json().then(function(json) {
      const score = calculateScore(json.result.score);
      let smile = 'fa-meh-o'
      if (score > 0) smile = 'fa-smile-o';
      else if (score < 0) smile = 'fa-frown-o';
      
      document.getElementById('score').innerHTML = score;
      document.getElementById('smile').innerHTML = '<i class="fa ' + smile + ' " aria-hidden="true"></i>'
      document.getElementById('rank').innerHTML = json.result.rank;
    });
  }, function(error) {
    document.getElementById('status').innerHTML = error.message;
  }); 
}

function calculateScore(score) {
  return Math.round(score * 100);
}

function thumbsUpButtonOnclick() {
  const error = validateInput();
  if (!error) sendThumb('up');
  else setStatus(error);
}

function thumbsDownButtonOnclick() {
  const error = validateInput();
  if (!error) sendThumb('down');
  else setStatus(error);
}

function sendThumb(type) {
  setStatus('Sending data...');
  const license = document.getElementById('plateNumber');
  try {
    fetch(apiUrl + 'thumbs' + type, {
      method: "POST",
      body: JSON.stringify({
        "hash": window.localStorage.getItem('hash'),
        "country": 'NL',
        "license": license.value
      }),
      headers: { "Content-Type": "application/json" }
    }).then(function(response) {
      response.json().then(function(json) {
        if (json.error) setStatus('Error: ' + json.message)
        else {
          setStatus(json.message);
          retrieveAndSetScore();          
        }
      });
      license.value = '';
    }, function(error) {
      setStatus(error.message);
    })      
  } catch (error) {
    setStatus('Try error: ' + error.message);    
  }

}

function saveMyPlateNumber() {
  const data = getMyPlateNumber();
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
};

function validateInput() {
  let error = false;
  const plateNumber = document.getElementById('plateNumber').value;
  if (plateNumber.length <= 0) {
    error = 'Missing platenumber';
  }
  return error;
}

function getMyPlateNumber() {
  let result = {
    plate: '',
    error: false
  };
  const plateNumber = document.getElementById('myPlateNumber').value;
  if (plateNumber.length <= 0) result.error = 'Missing platenumber';
  else result.plate = plateNumber;

  return result;
}

function setStatus(message) {
  document.getElementById('status').innerHTML = message;  
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

function showRanking() {
  $('#content').load('ranking.html', () => {
    $('#back').on('click', loadMain);
    fetch(apiUrl + 'top100/')
        .then(response => {
          return response.json();
        })
        .then(json => {
          json.result.forEach((row, index) => {
            $('#top100').append(`
                <tr${row.country == myCountry && row.license == myLicense ? ' class="self"' : ''}>
                  <td>${index + 1}</td>
                  <td>${row.country}</td>
                  <td>${row.license}</td>
                  <td>${calculateScore(row.weighted_score)}</td>
                </tr>
            `);
          });
        });
  });
}
