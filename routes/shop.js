var express = require('express');
var router = express.Router();

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');
var _siteData = require('../utility/site-data');

var LocalAccount = require('../models/localAccount');
var Quote = require('../models/quote');
var Order = require('../models/order');
var Reservation = require('../models/reservation');

var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

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
                }
            });

        }
    });
});


router.get('/reservation/fromquote/:quoteid', csrfProtection, function(req, res) {
    Quote.findById(req.params.quoteid,(err,_quote)=>{
        if(err){
            res.json(err);
        }else{
            req.session.redirectTo = "/shop/reservation/fromquote/"+req.params.quoteid;

            let _data = {
                username: (req.user) ? req.user.username : '',
                name: (req.user) ? req.user.name : '',
                surname: (req.user) ? req.user.surname : '',
                email: (req.user) ? req.user.email : '',
                phonenumber: (req.user) ? req.user.phonenumber : '',
                address1: (req.user) ? req.user.address1 : '',
                address2: (req.user) ? req.user.address2 : '',
                address3: (req.user) ? req.user.address3 : '',
                address4: (req.user) ? req.user.address4 : '',
                addressZip: (req.user) ? req.user.addressZip : '',

            }

            res.render('shop/new_reservation_quote', {
                page_title: "middlemanager demo site",
                page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
                page_path: req.path,
                page_type: "website",
                loggedin: (req.user) ? 1 : 0,
                loggedin_name:  (req.user) ? req.user.nickname : '',
                loggedin_image:  (req.user) ? req.user.profile_pic :'',
                quote:_quote,
                data: _data,
                siteData:_siteData,
                unitData:_unitData,
                csrfToken: req.csrfToken(),
            });
        }
    });
});

router.post('/reservation/fromquote/:quoteid', csrfProtection, function(req, res) {
    if(req.user && req.user.spacemanager && req.user.spacemanager.CustomerID != ''){
        //add reservation to existing account
        res.json("R1");
    }else if(req.user){
        //create reservation and save customer ID and reservation ID
        Quote.findById(req.params.quoteid,(err,_quote)=>{
            if(err){
                res.json(err);
            }else{
                let reservation_obj = {
                    isite:      _quote.site,
                    isurname:   req.body.surname,
                    iforenames: req.body.name,
                    ititle:     req.body.title,
                    Add1:       req.body.address1,
                    Add2:       req.body.address2,
                    Add3:       req.body.address3,
                    Town:       req.body.address4,
                    Postcode:   req.body.addressZip,
                    iemailaddress: req.body.email,
                    // inumber:    req.body.phonenumber.replace('+','%2B'),
                    imovein: req.body.imoveindate,
                    isizecode:  _quote.sizecode,
                    idepositamt: req.body.deposit,     
                    ivatamt:    req.body.ivatamt,
                    // ipaymethod: req.body.ipaymethod,
                    ipayref:    req.body.ipayref,
                    icomment:   req.body.note,
                }
                console.log( reservation_obj );
                mm.addCustomerWithReservation(reservation_obj, (err,result)=>{
                    if(err){
                        res.json(err);
                        //new Error:
                        //"Error: Code: -194 Msg: No primary key value for foreign key 'iqacpaymentmethod' in table 'AccountLink'"
                        //I think the test DB I have needs to know the pay refs in advance?

                    }else{
                        //getting errors a lot here:
                        //[ { "'INVALID Phone'": 'INVALID Phone' } ]
                        //removed the phone number from the object for now going to try .replace('+','%2B');

                        //res.json(result);
                        console.log(result);

                        //TODO: This is a mess of nested callbacks. do them with an async tool
                        LocalAccount.findByIdAndUpdate(req.user._id, { spacemanager: result[0], CustomerID: result[0].CustomerID  }, function (err, account) {
                            if (err) {
                                res.json(err);
                            } else {
                                // TODO: delete quote from user and from quote table...
                                // redirect to the dashboard
                                // res.redirect('/account');
                                let _reservation = new Reservation({
                                    ReservationID:result[0].ReservationID,
                                    reservation:{
                                        ReservationID: result[0].ReservationID,
                                        InvoiceID: result[0].InvoiceID,
                                        PaymentID: result[0].PaymentID,
                                    },
                                    site: _quote.site,
                                    sizecode: _quote.sizecode,
                                    pricePerMonth: _quote.pricePerMonth,
                                    pricePerWeek: _quote.pricePerWeek,
                                    terms:"Add some TandC here"
                                });
                                _reservation.save((err,new_reservation)=>{
                                    if(err){
                                        res.json(err)
                                    }else{
                                        LocalAccount.findByIdAndUpdate(req.user._id, { $push: { reservations: new_reservation.id } }, (err, account) =>{
                                            if(err){
                                                res.json(err);
                                            }else{
                                                res.json(result);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }else{
        //create local account, save the new customer ID and reservation
        res.json("R3");
    }
});

router.get('/order/fromquote/:quoteid', csrfProtection, function(req, res) {
    Quote.findById(req.params.quoteid,(err,_quote)=>{
        if(err){
            res.json(err);
        }else{
            req.session.redirectTo = "/shop/order/fromquote/"+req.params.quoteid;

            let _data = {
                username: (req.user) ? req.user.username : '',
                name: (req.user) ? req.user.name : '',
                surname: (req.user) ? req.user.surname : '',
                email: (req.user) ? req.user.email : '',
                phonenumber: (req.user) ? req.user.phonenumber : '',
                address1: (req.user) ? req.user.address1 : '',
                address2: (req.user) ? req.user.address2 : '',
                address3: (req.user) ? req.user.address3 : '',
                address4: (req.user) ? req.user.address4 : '',
                addressZip: (req.user) ? req.user.addressZip : '',

            }

            res.render('shop/new_order_quote', {
                page_title: "middlemanager demo site",
                page_description: "Demo of using the middlemanager API to interact with the SpaceManager database",
                page_path: req.path,
                page_type: "website",
                loggedin: (req.user) ? 1 : 0,
                loggedin_name:  (req.user) ? req.user.nickname : '',
                loggedin_image:  (req.user) ? req.user.profile_pic :'',
                quote:_quote,
                data: _data,
                siteData:_siteData,
                unitData:_unitData,
                csrfToken: req.csrfToken(),
            });
        }
    });
});



/* GET home page. */
router.get('/', function(req, res, next) {
    res.send("Welcome to the shop!");
});

module.exports = router;