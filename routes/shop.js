var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');

/* GET home page. */
router.get('/:all', function(req, res, next) {
    res.send(req.params.all);
});

module.exports = router;