var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);

    const myPlateNumber = window.localStorage.getItem("myPlateNumber");
    if (myPlateNumber && myPlateNumber.length > 0 ) {
      setMyPlateInHeader(myPlateNumber);
      hide('myPlateNumberForm');
    } else {
      show('myPlateNumberForm');
      hide('main');
    }
  },

  onDeviceReady: function() {
    document.getElementById('like').onclick = function() {
      const error = validateInput();
      if (!error) thumbsUp();
      else setStatus(error);
    };
    document.getElementById('dislike').onclick = function() {
      const error = validateInput();
      if (!error) thumbsDown();
      else setStatus(error);
    };

    document.getElementById('save').onclick = saveMyPlateNumber; 
  },

  fetchData: function() {
    fetch('http://echo.jsontest.com/key/value/one/two').then(function(response) {
      response.json().then(function(json) {
        document.getElementById('status').innerHTML = json.one;
      });
    }, function(error) {
      document.getElementById('status').innerHTML = error.message;
    });    
  },

};

function thumbsUp() {
  sendThumb('up');
}
function thumbsDown() {
  sendThumb('down');
}

function sendThumb(type) {
  setStatus('Sending data...');
  const license = document.getElementById('plateNumber');
  try {
    fetch('http://phondr.com:3000/api/thumbs' + type, {
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
        else setStatus(json.message);
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