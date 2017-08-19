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
      if (!error) setStatus('Like');
      else setStatus(error);
    };
    document.getElementById('dislike').onclick = function() {
      const error = validateInput();
      if (!error) setStatus('Dislike');
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

function saveMyPlateNumber() {
  const data = getMyPlateNumber();
  if (!data.error) {
    window.localStorage.setItem("myPlateNumber", data.plate);
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