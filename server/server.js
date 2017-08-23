var express = require('express');
var bodyParser = require('body-parser');
var routes = require('./routes.js');
var app = express();
var port = 3141;

var Server = {

	configureExpress: function() {
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(bodyParser.json());
		app.use(function(req, res, next) {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
			next();
		});
		var router = express.Router();
		app.use('/api', router);
		
		routes(router);
	},

	start: function() {
		this.configureExpress();
		
		app.listen(port, function () {
			console.log(`Bumpr server running on port ${port}.`);
		});
	},

	stop: function() {
		process.exit(1);
	}
};

Server.start();
