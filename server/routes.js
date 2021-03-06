"use strict";

var _ = require('lodash');
var mysql = require('mysql');
var validators = require('./validators.json');

module.exports = function (router) {
	
	var pool = mysql.createPool({
		connectionLimit: 100,
		host: 'api.bumpr.me',
		user: 'bumpr_user',
		password: 'FanaticalCouncilman',
		database: 'bumpr',
		debug: false
	});
			
	var query = function (res, sql, values, cb) {
		pool.getConnection((err, connection) => {
			if (err) {
				res.json({error: true, message: 'A database problem occurred, please try again later.'});
				console.error('Error connecting to database:', err);
				return;
			}
			
			connection.query(sql, values, (err, rows) => {
				connection.release();
				if (err) {
					console.error('Error executing query:', err);
					res.json({error: true, message: 'A database problem occurred, please try again later.'});
				} else {
					cb(res, rows);
				}
			});
		});
	};
	
	var send = function (res, data) {
		res.json({error: false, message: 'OK', result: data});
	};
	
	router.get('/', (req, res) => {
		res.json({message: 'Bumpr REST API'});
	});
	
	var validateLicense = function (license, country) {
		const validator = validators[country] || '[A-Z0-9]{1,9}';
		return (new RegExp(`^${validator}$`)).test(license);
	};
	
	var thumbs = function (req, res, upDown) {
		var license = req.body.license.toUpperCase();
		var country = req.body.country.toUpperCase();
		if (!validateLicense(license, country)) {
			return res.json({error: true, message: 'Invalid license plate number'});
		}
		var sql = 'INSERT INTO points (hash, country, license, score, location_lat, location_lng) VALUES (?, ?, ?, ?, ?, ?)';
		let location = req.body.location || {lat: null, lng: null};
		var values = [req.body.hash.toLowerCase(), country, license, upDown ? 1 : -1, location.lat, location.lng];
		query(res, sql, values, send);
	};
	
	router.post('/thumbsup', function (req, res) {
		thumbs(req, res, true);
	});
	
	router.post('/thumbsdown', function (req, res) {
		thumbs(req, res, false);
	});
	
	router.get('/score/:country/:license', function (req, res) {
		var country = req.params.country.toUpperCase();
		var license = req.params.license.toUpperCase();
		
		if (!validateLicense(license, country)) {
			return res.json({error: true, message: 'Invalid license plate number'});
		}
		
		// var sql = `
		// 		SELECT SUM(score / count) AS weighted_score FROM points
		// 			LEFT JOIN (
		// 				SELECT hash, COUNT(*) AS count FROM points
		// 				WHERE ts >= DATE_SUB(NOW(), INTERVAL 1 DAY)
		// 				GROUP BY hash
		// 			) AS counts
		// 			ON counts.hash = points.hash
		// 			WHERE points.ts >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
		// 			AND points.country = ?
		// 			AND points.license = ?
		// `;
		
		var sql = `
			SELECT points.country, points.license, SUM(score / count) AS score FROM points
				LEFT JOIN (
					SELECT hash, COUNT(*) AS count FROM points
					WHERE ts >= DATE_SUB(ts, INTERVAL 1 DAY)
					GROUP BY hash
				) AS counts
				ON counts.hash = points.hash
				WHERE points.ts >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
				GROUP BY country, license
				ORDER BY score DESC, license
		`;
		query(res, sql, [], (res, rows) => {
			var index = _.findIndex(rows, {country, license});
			var score = (rows[index] || {}).score || 0;
			var rank = index + 1;
			send(res, {score, rank});
		});
	});
	
	var topBottom = function (req, res, bottom, limit) {
		var startRank = 0;
		if (bottom) {
			startRank = '(SELECT COUNT(*) FROM (SELECT DISTINCT country, license FROM points) l) + 1';
		}
		
		var sql = `
				SELECT p.country, p.license, p.score, @rownum := @rownum ${bottom ? '-' : '+'} 1 AS rank
					FROM (SELECT @rownum := ${startRank}) r, 
						(SELECT points.country, points.license, SUM(score / cnt) AS score
							FROM points
							LEFT JOIN (
								SELECT hash, COUNT(*) AS cnt FROM points
								WHERE ts >= DATE_SUB(ts, INTERVAL 1 DAY)
								GROUP BY hash
							) AS counts
							ON counts.hash = points.hash
							WHERE points.ts >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
							GROUP BY country, license
							ORDER BY score ${bottom ? 'ASC' : 'DESC'}, license ${bottom ? 'DESC' : 'ASC'} LIMIT ${limit}) p		
		`;
		query(res, sql, [], send);
	};
	
	router.get('/top100', (req, res) => {
		topBottom(req, res, false, 100);
	});
	
	router.get('/bottom100', (req, res) => {
		topBottom(req, res, true, 100);
	});
	
	router.get('/top10', (req, res) => {
		topBottom(req, res, false, 10);
	});
	
	router.get('/bottom10', (req, res) => {
		topBottom(req, res, true, 10);
	});
};
