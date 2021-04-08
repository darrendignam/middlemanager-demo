var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');

/* GET home page. */
router.get('/index', function(req, res, next) {
  // mm.testing();
  res.render('index', { title: 'Express' });
});



router.get('/test', function(req, res) {
  mm.getAllAvaliableUnits( function(err, response) {
    if(err){
      res.send(err);
    }else{
      res.json(response.body);
    }
  });
});

router.get('/test_units', function(req, res) {
  mm.getAvaliableUnits({"iSite":"RI1GRWXX250320060000","iSize":"RI0ZFCRI08022018004L"}, 
  function(err, response) {
    if(err){
      res.send(err);
    }else{
      res.json(response.body);
    }
  });
});


module.exports = router;
