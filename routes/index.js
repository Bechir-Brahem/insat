var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
	res.render('index/index', { title: 'Express' });
});
router.get('/actualite', function (req, res) {
	res.render('actualite/actualites', { title: 'Express' });
});
router.get('/actualite/1', function (req, res) {
	res.render('actualite/actualite', { title: 'Express' });
});

module.exports = router;
