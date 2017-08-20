var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var routes = require('./routes.js');
var app = express();
var port = 3141;

var Server = {
	connectDb: function() {
		return new Promise((resolve, reject) => {
			var pool = mysql.createPool({
				connectionLimit: 100,
				host: 'db.phondr.com',
				user: 'bumpr_user',
				password: 'FanaticalCouncilman',
				database: 'bumpr',
				debug: false
			});
			
			pool.getConnection((err, connection) => {
				if (err) {
					console.error('MYSQL CONNECTION ERROR:', err);
					reject(err);
				} else {
					resolve(connection);
				}
			});
		});
	},

	configureExpress: function(db) {
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(bodyParser.json());
		app.use(function(req, res, next) {
			res.header('Access-Control-Allow-Origin', '*');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
			next();
		});
		var router = express.Router();
		app.use('/api', router);
		
		routes(router, db);
	},

	start: function() {
		this.connectDb()
				.then(db => {
					this.configureExpress(db);
					
					app.listen(port, function () {
						console.log(`Bumpr server running on port ${port}.`);
					});
				})
				.catch(err => {
					this.stop(err);
				})
		;
	},

	stop: function() {
		process.exit(1);
	}
};

Server.start();
