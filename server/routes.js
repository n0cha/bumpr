module.exports = function (router, connection) {
	var send = function (req, res, sql, values) {
		connection.query(sql, values, (err, rows) => {
			if (err) {
				res.json({error: true, message: 'Error executing MySQL query'});
			} else {
				res.json({error: false, message: 'OK', result: rows});
			}
		});
	};
	
	router.get('/', (req, res) => {
		res.json({'Message': 'Bumpr REST API'});
	});
	
	var thumbs = function (req, res, upDown) {
		var sql = 'INSERT INTO points (hash_from, license_to, country_to, score) VALUES (?, ?, ?, ?)';
		var values = [req.body.hash.toLowerCase(), req.body.license.toUpperCase(), req.body.country.toUpperCase(), upDown ? 1 : -1];
		send(req, res, sql, values);
	};
	
	router.post('/thumbsup', function (req, res) {
		thumbs(req, res, true);
	});
	
	router.post('/thumbsdown', function (req, res) {
		thumbs(req, res, false);
	});
	
	router.get('/score/:country/:license', function (req, res) {
		var sql = 'SELECT SUM(score) AS score FROM points WHERE country_to = ? AND license_to = ?';
		var values = [req.params.country, req.params.license];
		send(req, res, sql, values);
	});
	
	var topBottom = function (req, res, isTop) {
		var sql = 'SELECT country_to, license_to, SUM(score) AS score FROM points GROUP BY country_to, license_to ORDER BY score ' + (isTop ? 'DESC' : 'ASC') + ' LIMIT 100';
		send(req, res, sql);
	};
	
	router.get('/top100', (req, res) => {
		topBottom(req, res, true);
	});
	
	router.get('/bottom100', (req, res) => {
		topBottom(req, res, false);
	});
};
