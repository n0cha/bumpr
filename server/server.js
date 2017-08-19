var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var routes = require('./routes.js');
var app = express();

function Server(){
	this.connectMysql();
}

Server.prototype.connectMysql = function() {
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
			this.stop(err);
		} else {
			this.configureExpress(connection);
		}
	});
};

Server.prototype.configureExpress = function(connection) {
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	var router = express.Router();
	app.use('/api', router);
	routes(router, connection);
	this.startServer();
};

Server.prototype.startServer = function() {
	app.listen(3000, function() {
		console.log('Bumpr server running on port 3000.');
	});
};

Server.prototype.stop = function(err) {
	console.log('MYSQL CONNECTION ERROR:', err);
	process.exit(1);
};

new Server();
