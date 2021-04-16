var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');
var _siteData = require('../utility/site-data');

var Quote = require('../models/quote');
var LocalAccount = require('../models/localAccount');

router.get('/cart', function(req, res){
    _quotes = [];

    if(req.user){
        _quotes = req.user.quotes;

        LocalAccount.findById(req.user._id)
        .populate('quotes')
        .exec((err,user)=>{
            if(err){
                res.json(err);
            }else{
                _quotes = user.quotes;
                
                res.render('shop/quotes', {
                    page_title: "middlemanager demo site",
                    page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
                    page_path: req.path,
                    page_type: "website",
                    loggedin: (req.user) ? 1 : 0,
                    loggedin_name:  (req.user) ? req.user.nickname : '',
                    loggedin_image:  (req.user) ? req.user.profile_pic :'',
                    quotes:_quotes,
                    siteData:_siteData,
                    unitData:_unitData,
                });
            }
        });
    }else if(req.session && req.session.quotes){
        _quotes = req.session.quotes;
        res.render('shop/quotes', {
            page_title: "middlemanager demo site",
            page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
            page_path: req.path,
            page_type: "website",
            loggedin: (req.user) ? 1 : 0,
            loggedin_name:  (req.user) ? req.user.nickname : '',
            loggedin_image:  (req.user) ? req.user.profile_pic :'',
            quotes:_quotes,
            siteData:_siteData,
            unitData:_unitData,
        });
    }
});

router.get('/quote/view/:quoteid', function(req, res){
    Quote.findById(req.params.quoteid,(err, _quote)=>{
        if(err){
            res.json(err);
        }else{
            res.render('shop/quote', {
                page_title: "middlemanager demo site",
                page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
                page_path: req.path,
                page_type: "website",
                loggedin: (req.user) ? 1 : 0,
                loggedin_name:  (req.user) ? req.user.nickname : '',
                loggedin_image:  (req.user) ? req.user.profile_pic :'',
                quote:_quote,
                siteData:_siteData,
                unitData:_unitData,
            });
        }
    });
});

router.get('/quote/new/:siteid/unitsize/:sizecodeid', function(req, res) {
    //So to generate a quote, an anchor tag takes you here, the quote is generated - and you goto see it in your 'cart'
    mm.getAllAvaliableUnits((err,response)=>{
		let _unit = {};
        let _site = {};
        let iserr = false; 

		if(err){
            iserr = err;
		}else{
            _site = response.filter((site)=>{
                return site.details.siteid == req.params.siteid;
            });
            if (_site.length != 1){
                iserr = 2;
            }else{
                _unit = _site[0].units.filter((unit)=>{
                    return unit.SizeCodeID == req.params.sizecodeid;
                });
                // console.log(_unit);

                if (_unit.length < 1){
                    iserr = 3;
                }else{
                    _unit = _unit[0];
                    _site = _site[0];
                }
            }
		}
       
        if(iserr!==false){
            req.flash('error', 'There was a problem generating quote! Try again or contact us! '+iserr);
            res.redirect(`/site/${req.params.siteid}/unitsize/${req.params.sizecodeid}`);
        }else{

            //process quote:
            let _quote = new Quote({
                site: _site.details.siteid,
                sizecode: _unit.SizeCodeID,
                pricePerMonth: _unit.MonthRate,
                pricePerWeek: _unit.Weekrate,
                terms:"Add some TandC here"
            });
            _quote.save((err, new_quote)=>{
                if(err){
                    res.json(err);
                }else{

                    if(req.user){
                        //If logged in then add quote to the quotes array
                        LocalAccount.findByIdAndUpdate(req.user._id, { $push: { quotes: new_quote.id } }, function (err, account) {
                            if (err) {
                                res.json(err);
                            } else {
                                // redirect to the quote view page
                                res.redirect(`/shop/quote/view/${new_quote.id}`);
                            }
                        });
                    }else{
                        //If not logged in, add this quote to the session cookie. If they login in future, capture the session array.
                        if (req.session.quotes){
                            req.session.quotes.push(_quote)
                        }else{
                            req.session.quotes = [ _quote ]
                        }
                        res.redirect(`/shop/quote/view/${new_quote.id}`);
                    }

                    

                    // redirect to the quote view page
                    // res.json(new_quote);
                }
            });

        }
        //res.send("SITE: " + req.params.siteid + "SIZE: " + req.params.sizecodeid);

		//send to the renderer
		// res.render('sites/unit', {
		// 	page_title: "middlemanager demo site",
		// 	page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
		// 	page_path: req.path,
		// 	page_type: "website",
		// 	loggedin: (req.user) ? 1 : 0,
		// 	loggedin_name:  (req.user) ? req.user.nickname : '',
		// 	loggedin_image:  (req.user) ? req.user.profile_pic :'',
        //     site:_site,
		// 	unit:_unit,
        //     siteData:_siteData,
        //     unitData:_unitData,
		// });

        //res.json(_quote);
    });
});




/* GET home page. */
router.get('/', function(req, res, next) {
    res.send("Welcome to the shop!");
});

module.exports = router;