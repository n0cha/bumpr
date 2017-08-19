const apiUrl = 'http://phondr.com:3000/api/';

var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  onDeviceReady: function() {
    const hash = window.localStorage.getItem("hash");
    if (hash && hash.length === 31) {
      hide('myPlateNumberForm');
      setMyPlateInHeader(window.localStorage.getItem("myPlateNumber"));
      retrieveAndSetScore();
    } else {
      show('myPlateNumberForm');
      hide('main');
    }

    document.getElementById('like').onclick = thumbsUpButtonOnclick;
    document.getElementById('dislike').onclick = thumbsDownButtonOnclick;
    document.getElementById('save').onclick = saveMyPlateNumber; 
  },
};

function retrieveAndSetScore() {
  const path = apiUrl + 'score/' + 'NL/' + window.localStorage.getItem('myPlateNumber');
  fetch(path).then(function(response) {
    response.json().then(function(json) {
      document.getElementById('score').innerHTML = json.result.score;
      document.getElementById('rank').innerHTML = json.result.rank;
    });
  }, function(error) {
    document.getElementById('status').innerHTML = error.message;
  }); 
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
      })
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
    window.localStorage.setItem("myPlateNumber", data.plate);
    window.localStorage.setItem("hash", generateHash());
    setMyPlateInHeader(data.plate);
    hide('myPlateNumberForm');
    show('main');
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

function setMyPlateInHeader(plateNumber) {
  document.getElementById('me').innerHTML = plateNumber;
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