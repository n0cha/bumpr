var _ = require('lodash');

module.exports = function (router, db) {
	
	var query = function (res, sql, values, cb) {
		db.query(sql, values, (err, rows) => {
			if (err) {
				res.json({error: true, message: 'Error executing MySQL query'});
			} else {
				cb(res, rows);
			}
		});
	};
	
	var send = function (res, data) {
		res.json({error: false, message: 'OK', result: data});
	};
	
	router.get('/', (req, res) => {
		res.json({'Message': 'Bumpr REST API'});
	});
	
	var thumbs = function (req, res, upDown) {
		var sql = 'INSERT INTO points (hash_from, country_to, license_to, score) VALUES (?, ?, ?, ?)';
		var values = [req.body.hash.toLowerCase(), req.body.country.toUpperCase(), req.body.license.toUpperCase(), upDown ? 1 : -1];
		query(res, sql, values, send);
	};
	
	router.post('/thumbsup', function (req, res) {
		thumbs(req, res, true);
	});
	
	router.post('/thumbsdown', function (req, res) {
		thumbs(req, res, false);
	});
	
	router.get('/score/:country/:license', function (req, res) {
		var sql = `SELECT SUM(score) AS score FROM points WHERE country_to = ? AND license_to = ?`;
		var country = req.params.country.toUpperCase();
		var license = req.params.license.toUpperCase();
		var values = [country, license];
		query(res, sql, values, rows => {
			var score = rows[0].score;
			sql = 'SELECT country_to AS country, license_to AS license, SUM(score) AS score FROM points GROUP BY country_to, license_to ORDER BY score DESC';
			query(res, sql, values, rows => {
				var rank = _.findIndex(rows, {country, license}) + 1;
				send(res, {score, rank});
			});
		});
	});
	
	var topBottom = function (req, res, isTop) {
		var sql = 'SELECT country_to, license_to, SUM(score) AS score FROM points GROUP BY country_to, license_to ORDER BY score ' + (isTop ? 'DESC' : 'ASC') + ' LIMIT 100';
		query(res, sql, [], send);
	};
	
	router.get('/top100', (req, res) => {
		topBottom(req, res, true);
	});
	
	router.get('/bottom100', (req, res) => {
		topBottom(req, res, false);
	});
};
