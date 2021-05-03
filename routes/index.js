var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');

const json2csv = require('json2csv').parse;

/* GET home page. */
router.get('/', function(req, res, next) {
    mm.getAllAvaliableUnits((err,response)=>{
        let _sites = [];
        if(err){
            _sites = [];
            //probably redirect to a static verion of the website here
        }else{
            _sites = response;

            // sort the results by price:
            for(let i =0; i <_sites.length; i++){
                _sites[i].units.sort((a, b) => parseFloat(a.MonthRate) - parseFloat(b.MonthRate));
            }
        }

        //send to the renderer
        res.render('index', {
            page_title: "middlemanager demo site",
            page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
            page_path: req.path,
            page_type: "website",
            loggedin: (req.user) ? 1 : 0,
            loggedin_name:  (req.user) ? req.user.nickname : '',
            loggedin_image:  (req.user) ? req.user.profile_pic :'',
            sites:_sites,
            unitData:_unitData,
        });
    });

});

router.get('/all-data', function(req, res) {
  mm.getAllAvaliableUnitsTable( function(err, response) {
    if(err){
      res.send(err);
    }else{
      res.render('data/all-data');
    }
  });
});

router.get('/all-json', function(req, res) {
  mm.getAllAvaliableUnitsTable( function(err, response) {
    if(err){
      res.send(err);
    }else{
      res.json(response);
    }
  });
});

router.get('/all-table', function(req, res) {
  mm.getAllAvaliableUnitsTable( function(err, response) {
    if(err){
      res.send(err);
    }else{
      res.render('data/all-table', {data:response});
    }
  });
});

router.get('/all-csv', function(req, res) {
  mm.getAllAvaliableUnitsTable( function(err, response) {
    if(err){
      res.send(err);
    }else{
      const csvString = json2csv(response);  // This function blocks the Event Loop, so probably implement a download link like his in a microservice. Or create a worker process to save a CSV to the FS and
                                             // later access thee CSV files with static anchor tag links. Check the npm docks for json2csv
      res.setHeader('Content-disposition', 'attachment; filename=all-units.csv'); //could do something with the filename here.
      res.set('Content-Type', 'text/csv');
      res.status(200).send(csvString);
    }
  });
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
