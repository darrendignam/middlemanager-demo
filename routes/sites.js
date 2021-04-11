var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');

/* GET site page. */
router.get('/:siteid', function(req, res, next) {
    res.send("SITE: " + req.params.siteid);
});

/* GET unit page. */
router.get('/:siteid/:sizecodeid', function(req, res, next) {
    // res.send("SITE - UNIT");
    mm.getAllAvaliableUnits((err,response)=>{
		let _sites = [];
		if(err){
			_sites = [];
			//probably redireect to a static verion of the website here
		}else{
			_sites = response;
		}

		//send to the renderer
		res.render('sites/unit', {
			page_title: "middlemanager demo site",
			page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
			page_path: req.path,
			page_type: "website",
			loggedin: (req.user) ? 1 : 0,
			loggedin_name:  (req.user) ? req.user.nickname : '',
			loggedin_image:  (req.user) ? req.user.profile_pic :'',
			sites:_sites,
		});
    });
});

module.exports = router;