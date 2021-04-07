var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');

/* GET home page. */
router.get('/index', function(req, res, next) {
  mm.testing();
  res.render('index', { title: 'Express' });
});



router.get('/test', function(req, res) {
  mm.getAvaliableUnits( function(err, response) {
    if(err){
      res.send(err);
    }else{
      res.json(response.body);
    }
  });
});


module.exports = router;
