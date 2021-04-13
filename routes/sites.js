var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');

/* GET site page. */
router.get('/:siteid', function(req, res, next) {
    res.send("SITE: " + req.params.siteid);
});

/* GET unit page. */
router.get('/:siteid/:sizecodeid', function(req, res, next) {
    // res.send("SITE - UNIT");
    
    mm.getAllAvaliableUnits((err,response)=>{
		let _unit = {};
        let _site = {};
		if(err){
			_unit = {};
            _site = {};
			//probably redirect to home, or an apology that unit not found.
		}else{
            _site = response.filter((site)=>{
                return site.details.siteid == req.params.siteid;
            });
            if (_site.length != 1){
                _unit = {};
                _site = {};
            }else{
                _unit = _site[0].units.filter((unit)=>{
                    console.log(unit.SizeCodeID);
                    return unit.SizeCodeID == req.params.sizecodeid;
                });
                console.log(_unit);

                if (_unit.length < 1){
                    _unit = {};
                    _site = {};
                }else{
                    _unit = _unit[0];
                    _site = _site[0];
                }
            }
		}
       

        //res.send("SITE: " + req.params.siteid + "SIZE: " + req.params.sizecodeid);

		//send to the renderer
		res.render('sites/unit', {
			page_title: "middlemanager demo site",
			page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
			page_path: req.path,
			page_type: "website",
			loggedin: (req.user) ? 1 : 0,
			loggedin_name:  (req.user) ? req.user.nickname : '',
			loggedin_image:  (req.user) ? req.user.profile_pic :'',
            site:_site,
			unit:_unit,
            unitData:_unitData,
		});
    });
});

module.exports = router;