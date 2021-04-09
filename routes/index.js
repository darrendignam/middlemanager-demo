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
      res.json(response);
    }
  });
});

router.get('/test_units', function(req, res) {
	mm.post_request("/api/v1/base/WGetSiteDetails", {}, function(err, response) {
						if(err){
							res.json(err);
						}else{
							if(response.errno){
								res.send("<pre style='color:red'>" + err + "</pre>");
							}else{
								res.json(response);
							}
						}
	});
});

  // mm.getAvaliableUnits({"iSite":"RI1GRWXX250320060000","iSize":"RI0ZFCRI08022018004L"}, 
  // function(err, response) {
  //   if(err){
	// 		console.log("001");
	// 		console.log(err);
	// 		console.log(response);
  //     //res.send("<pre style='color:red'>" + err + "</pre>");
	// 		res.json(err);
  //   }else{
	// 		if(response.errno){
	// 			console.log("002")
	// 			res.send("<pre style='color:red'>" + err + "</pre>");
	// 		}else{
	// 			console.log("003")
	// 			res.json(response);
	// 		}
  //   }
  // });


module.exports = router;
