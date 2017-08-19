var app = {
  initialize: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },

  onDeviceReady: function() {
    fetch('http://echo.jsontest.com/key/value/one/two').then(function(response) {
      response.json().then(function(json) {
        document.getElementById('status').innerHTML = json.one;
      });
    }, function(error) {
      document.getElementById('status').innerHTML = error.message;
    })  
  },

}; 