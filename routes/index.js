var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');

/* GET home page. */
router.get('/index', function(req, res, next) {
  mm.testing();
  res.render('index', { title: 'Express' });
});



router.get('/test', function(req, res) {
  console.log('1');
  mm.getAvaliableUnits( function(err, result) {
    if(err){
      console.log('11');
      res.send(err);
    }else{
      console.log('12');
      res.send(result);
    }
  });
});


module.exports = router;
