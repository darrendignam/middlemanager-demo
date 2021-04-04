var express = require('express');
var router = express.Router();
var mongoose = require('mongoose'); //mongo connection

var passport = require('passport');
var LocalAccount = require('../models/localAccount');


//crypto and waterfall
var async = require('async-waterfall');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');//can probably comment this out. Buil in module.

//cross site request forgery :/
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });


//stripe payments
// var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function usernameToLowerCase(req, res, next) {
    req.body.username = req.body.username.toLowerCase();
    next();
}

//User dashboard page, edit details and review orders etc
router.get('/', csrfProtection, function (req, res) {
    if (req.user) {
        var responseData = {};
        responseData["loggedin"] = 1;
        responseData["message"] = "You are logged in";
        responseData["error"] = "";
        responseData["data"] = {};
        responseData["data"]["_id"] = req.user._id;
        responseData["data"]["username"] = req.user.username;
        responseData["data"]["nickname"] = req.user.nickname;
        responseData["data"]["email"] = req.user.email;
        responseData["data"]["name"] = req.user.name;
        responseData["data"]["surname"] = req.user.surname;
        responseData["data"]["address1"] = req.user.address1;
        responseData["data"]["address2"] = req.user.address2;
        responseData["data"]["address3"] = req.user.address3;
        responseData["data"]["address4"] = req.user.address4;
        responseData["data"]["addressZip"] = req.user.addressZip;
        responseData["data"]["phonenumber"] = req.user.phonenumber;
        responseData["data"]["profile_pic"] = req.user.profile_pic;
        responseData["data"]["oauthProvider"] = req.user.oauthProvider;
        responseData["data"]["created"] = req.user.created;

        res.format({
            html: function () {
                res.render('user_account/account', {
                    csrfToken: req.csrfToken(),
                    page_title: 'Register new user account',
                    page_description: "Aaccount registration. Here is where all the stuff is!",
                    page_path: req.path,
                    page_type: "website",
                    flash_info: req.flash('error'),
                    flash_success: req.flash('alert-success'),
                    loggedin: 1,
                    loggedin_name:  (req.user) ? req.user.nickname :'',
                    loggedin_image:  (req.user) ? req.user.profile_pic :'',
                    response: responseData,
                });
            },
            json: function () {
                res.json(responseData);
            }
        });

    } else {
        //res.send(401);
        req.flash('error', 'You need to be logged in to access this content');
        res.redirect('/account/login');
    }
});


//TODO: Update the html view.... but thats a given for the whole HTML version
router.get('/register', function (req, res) {
    req.logout();//should prob logout?
    res.render('user_account/register', {
        page_title: 'register a new account',
        page_description: "Create a new account. You can use your Google, or create a new one.",
        page_path: req.path,
        page_type: "website",
        loggedin: 0
    });

});


router.post('/register', 
// bruteforce.prevent, 
function (req, res) {
    LocalAccount.register(new LocalAccount({
        username: req.body.username,
        nickname: req.body.username,
        role: "user",
        email: req.body.email,
        name: req.body.name,
        surname: req.body.surname,
        oauthProvider: "local_provider",
        terms: constants.termsAndConditions.string,
        terms_version: constants.termsAndConditions.version,
        //profile_pic: "https://imagecache.example.com/avatar.php?size=150&hash=" + crypto.createHash('md5').update("" + req.body.username + "stuff" + req.body.email).digest('hex'),
        created: Date.now()
    }), req.body.password, function (err, user) {
        if (err) {
            var responseData = {};
            responseData["registered"] = 0;
            responseData["message"] = "You are not registered";
            responseData["error"] = err.code;
            responseData["data"] = {};
            var tmpErrMsg = "There was a probem creating your account. Please try again or contact our team who can assist.";
            res.format({
                html: function () {
                    console.log("sign up err: " + err.code);
                    if (err.code == 11000) {
                        tmpErrMsg = "We are sorry but that email or username is already taken. If this is your account try resetting your password. Or use the social login.";
                    } else if (err.message) {
                        tmpErrMsg = err.message;
                    }
                    res.render('user_account/register', {
                        error_message: tmpErrMsg,
                        page_title: 'register a new account',
                        page_description: "New account registration. Here is where all the stuff is!",
                        page_path: req.path,
                        page_type: "website",
                        loggedin: 0
                    });
                },
                json: function () {
                    res.json(responseData);
                }
            });
        } else {
            // Here would be a good place to send an email to the new user!
            // sendgridEmail.sendWelcomeEmail(req.body.email);//TODO: Send welcome email

            var responseData = {};
            responseData["registered"] = 1;
            responseData["message"] = "You are registered";
            responseData["error"] = "";
            responseData["data"] = {};

            req.login(user, function (err) {
                if (!err) {
                    //lets see if we can send the NEW user back to where they came from. Lets us jump out of the process flow to create an account, and go right back to where we were!
                    if (req.session.redirectTo && req.session.redirectTo != "") {
                        var tmp_redirect = req.session.redirectTo;
                        req.session.redirectTo = "";
                        if (tmp_redirect != '/account/login') {
                            req.flash('alert-success', 'Thanks for setting up an account - you can see your account details by clicking the icon in the top right of the screen.');
                            res.redirect(tmp_redirect);
                        } else {
                            req.flash('alert-success', 'Thanks for setting up an account - here you can update your personal details, create new posts, and see the activities you have under way.');
                            res.redirect('/account');
                        }
                    } else {
                        res.format({
                            html: function () {
                                //TODO: could haver a welcoming flash message here?
                                req.flash('alert-success', 'Thanks for setting up an account - here you can update your personal details, create new posts, and see the activities you have under way.');
                                res.redirect("/account");//send you home?
                            },
                            //JSON response will show the newly created blob
                            json: function () {
                                res.json(responseData);
                            }
                        });
                    }
                } else {
                    //handle error unable to login, we shouldnt end up here if everything went OK
                    req.flash('error', 'Problem logging into your new account? Try logging in again or contacting us for help.');
                    res.redirect("/");
                }
            });
        }
    });
});


router.get('/login', function (req, res) {
    res.render('user_account/login', {
        page_title: "Login to your account",
        page_description: "Account login. Login or request a password reset from this page. Use Google to sign up and log in.",
        page_path: req.path,
        page_type: "website",
        flash_info: req.flash('error'),
        flash_info2: req.flash('messageRedirect'),
        loggedin: (req.user) ? 1 : 0,
        loggedin_name:  (req.user) ? req.user.nickname :'',
        loggedin_image:  (req.user) ? req.user.profile_pic :''
    });
});


router.post('/login',
    // bruteforce.prevent,
    usernameToLowerCase,
    passport.authenticate('local', { failureRedirect: '/account/login', failureFlash: true }),
    function (req, res) {
        if (req.user) {
            res.format({
                html: function () {
                    //Try and send the freshley logged in user back to the place they were before loggin in
                    if (req.session.redirectTo && req.session.redirectTo != "") {
                        var tmp_redirect = req.session.redirectTo;
                        req.session.redirectTo = "";
                        if (tmp_redirect != '/account/login') {
                            res.redirect(tmp_redirect);
                        } else {
                            res.redirect('/account');
                        }
                    } else {
                        if (req.headers.referer == '/account/login') {
                            res.redirect('/account');
                        } else {
                            //console.log('redirect to previous url');
                            if (req.headers.referer == ("http://" + req.get('host') + '/account/login') || req.headers.referer == ("https://" + req.get('host') + '/account/login')) {
                                res.redirect('/account');
                            } else {
                                res.redirect(req.headers.referer);
                            }
                        }
                    }
                },
                json: function () {
                    var responseData = {};
                    responseData["loggedin"] = 1;
                    responseData["message"] = "You are logged in";
                    responseData["error"] = "";
                    responseData["data"] = {};
                    responseData["data"]["_id"] = req.user._id;
                    responseData["data"]["username"] = req.user.username;
                    responseData["data"]["nickname"] = req.user.nickname;
                    responseData["data"]["email"] = req.user.email;
                    responseData["data"]["name"] = req.user.name;
                    responseData["data"]["surname"] = req.user.surname;
                    responseData["data"]["address1"] = req.user.address1;
                    responseData["data"]["address2"] = req.user.address2;
                    responseData["data"]["address3"] = req.user.address3;
                    responseData["data"]["address4"] = req.user.address4;
                    responseData["data"]["addressZip"] = req.user.addressZip;
                    responseData["data"]["phonenumber"] = req.user.phonenumber;
                    responseData["data"]["profile_pic"] = req.user.profile_pic;
                    responseData["data"]["created"] = req.user.created;

                    res.json(responseData);
                }
            });

        } else {
            console.log("Login failed... redirecting....");
            req.flash('flash_message', 'Failed to log in.');
            req.flash('error', 'Could not log in. Try again or perhaps reset yopur password.')
            console.log("Flash Message");
            console.log(req.flash('error'));

            res.redirect('/account/login');
        }
    });

// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    //find the ID in the Database
    mongoose.model('LocalAccount').findById(id, function (err, item) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function () {
                    next(err);
                },
                json: function () {
                    res.json({ message: err.status + ' ' + err });
                }
            });
        } else {
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next();
        }
    });
});


//    /account/update/:id/edit
router.route('/update/:id/edit').post(csrfProtection, function(req, res) {
    console.log("Incoming ID" + req.id);
    console.log("User ID" + req.user._id);
    console.log(req.body);

    if (req.user && (req.user._id == req.id)) { //is logged in && is owner of this account!?!?!?
        // Get our REST or form values. These rely on the "name" attributes
        var nickname = req.body.nickname;
        var name = req.body.name;
        var surname = req.body.surname;
        var address1 = req.body.address1;
        var address2 = req.body.address2;
        var address3 = req.body.address3;
        var address4 = req.body.address4;
        var addressZip = req.body.addressZip;
        var phonenumber = req.body.phonenumber;
        var profile_pic = req.body.profile_pic;    
        var updated = Date.now();

        //find the document by ID
        mongoose.model('LocalAccount').findById(req.id, function (err, LocalAccount) {
            LocalAccount.update({
                nickname: nickname,
                name: name,
                surname: surname,
                address1: address1,
                address2: address2,
                address3: address3,
                address4: address4,
                addressZip: addressZip,
                phonenumber: phonenumber,
                profile_pic: profile_pic,
                updated: updated
            }, function (err, itemID) {
                if (err) {
                    var responseData = {};
                    responseData["loggedin"] = 1;
                    responseData["message"] = "There was an error...";
                    responseData["error"] = "There was a problem updating the information to the database: " + err;
                    console.log(responseData);
                    res.format({
                        html: function () {
                            req.flash('error', 'There was a problem updating your information, please try again');
                            res.redirect("/account");
                        },

                        json: function () {
                            res.json(responseData);
                        }
                    });
                } else {
                    var responseData = {};
                    responseData["loggedin"] = 1;
                    responseData["message"] = "Account updated";
                    responseData["error"] = "";
                    responseData["data"] = {};
                    responseData["data"]["_id"] = req.user._id;
                    responseData["data"]["username"] = req.user.username;
                    responseData["data"]["nickname"] = nickname;
                    responseData["data"]["email"] = req.user.email;
                    responseData["data"]["name"] = name;
                    responseData["data"]["surname"] = surname;
                    responseData["data"]["address1"] = address1;
                    responseData["data"]["address2"] = address2;
                    responseData["data"]["address3"] = address3;
                    responseData["data"]["address4"] = address4;
                    responseData["data"]["addressZip"] = addressZip;
                    responseData["data"]["phonenumber"] = phonenumber;
                    responseData["data"]["profile_pic"] = profile_pic;
                    responseData["data"]["created"] = req.user.created;
                    responseData["data"]["updated"] = updated;

                    res.format({
                        html: function () {
                            req.flash('alert-success', "Great - Account updated")
                            res.redirect("/account");//send you home?
                        },
                        json: function () {
                            res.json(responseData);
                        }
                    });
                }
            })
        });
    } else {//if not logged in....
        var responseData = {};
        responseData["loggedin"] = 0;
        responseData["message"] = "There was an error...";
        responseData["error"] = "You are not logged in";
        console.log(responseData);
        res.format({
            html: function () {
                res.flash('info', 'You need to be logged in to access this content.'); 
                res.redirect("/account");
            },
            //JSON response will show the newly created blob
            json: function () {
                res.json(responseData);
            }
        });
    }
});


// //Works with stripe, not implemented yet
// router.get('/payment_history', function (req, res) {
//     if (req.user) {
//         if (req.user.stripeResponse.id) {
//             stripe.customers.retrieve(req.user.stripeResponse.id,
//                 function (err, customer) {
//                     // asynchronously called
//                     if (err) {
//                         res.json({ "Error": err });
//                     } else {
//                         res.json({ "Error": null, "data": customer });
//                     }
//                 }
//             );
//         } else {
//             res.json({ "Error": "No payment data.", "data": "" });
//         }
//     } else {
//         res.json({ "Error": "Not Logged in.", "data": "" });
//     }
// });


//Google oAuth routes
router.post('/login/google/token',
    passport.authenticate('google-token'),
    function (req, res) {
        var responseData = {};
        responseData["loggedin"] = 1;
        responseData["message"] = "You are logged in";
        responseData["error"] = "";
        responseData["data"] = {};
        responseData["data"]["_id"] = req.user._id;
        responseData["data"]["username"] = req.user.username;
        responseData["data"]["nickname"] = req.user.nickname;
        responseData["data"]["email"] = req.user.email;
        responseData["data"]["name"] = req.user.name;
        responseData["data"]["surname"] = req.user.surname;
        responseData["data"]["address1"] = req.user.address1;
        responseData["data"]["address2"] = req.user.address2;
        responseData["data"]["address3"] = req.user.address3;
        responseData["data"]["address4"] = req.user.address4;
        responseData["data"]["addressZip"] = req.user.addressZip;
        responseData["data"]["phonenumber"] = req.user.phonenumber;
        responseData["data"]["profile_pic"] = req.user.profile_pic;
        responseData["data"]["created"] = req.user.created;
        res.json(responseData);
    }
);

router.get('/login/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//TODO - this return address might need changing!!!
router.get('/google/return', passport.authenticate('google', { failureRedirect: '/account/login', failureFlash: true }), function (req, res) {
    //res.redirect('/account_fb');

    var responseData = {};
    responseData["loggedin"] = 1;
    responseData["message"] = "You are logged in";
    responseData["error"] = "";
    responseData["data"] = {};
    responseData["data"]["_id"] = req.user._id;
    responseData["data"]["username"] = req.user.username;
    responseData["data"]["nickname"] = req.user.nickname;
    responseData["data"]["email"] = req.user.email;
    responseData["data"]["name"] = req.user.name;
    responseData["data"]["surname"] = req.user.surname;
    responseData["data"]["address1"] = req.user.address1;
    responseData["data"]["address2"] = req.user.address2;
    responseData["data"]["address3"] = req.user.address3;
    responseData["data"]["address4"] = req.user.address4;
    responseData["data"]["addressZip"] = req.user.addressZip;
    responseData["data"]["phonenumber"] = req.user.phonenumber;
    responseData["data"]["profile_pic"] = req.user.profile_pic;
    responseData["data"]["created"] = req.user.created;

    //TODO: This redirection mess should be refactored out
    res.format({
        html: function () {
            //lets see if we can send the user back to where they came from
            if (req.session.redirectTo && req.session.redirectTo != "") {
                var tmp_redirect = req.session.redirectTo;
                req.session.redirectTo = "";
                if (tmp_redirect != '/account/login') {
                    req.flash('alert-success', 'Thanks for setting up a your account - you can see your account details by clicking the icon in the top right of the screen.');
                    res.redirect(tmp_redirect);
                } else {
                    req.flash('alert-success', 'Thanks for setting up a your account - here you can update your personal details, create new posts, and see the activities you have under way.');
                    res.redirect('/account');
                }
            } else {
                res.format({
                    html: function () {
                        req.flash('alert-success', 'Thanks for setting up a your account - here you can update your personal details, create new posts, and see the activities you have under way.');
                        res.redirect("/account");//send you home?
                    },
                    json: function () {
                        res.json(responseData);
                    }
                });
            }
        },
        json: function () {
            res.json(responseData);
        }
    });

});


// Utility Functions
router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');//goto the home page
});

router.get('/ping', function (req, res) {
    res.status(200).send("pong!");
});

router.get('/forgot_password',
// bruteforce.prevent, 
function (req, res) {
    res.render('user_account/forgot_password', {
        page_title: 'reset your account password',
        page_description: "Password reset. If you have forgotton your password - enter the email address you used to create the account here, and start the reset process.",
        page_path: req.path,
        page_type: "website",
        loggedin: 0
    });
})

router.post('/forgot_password',
//  bruteforce.prevent, 
 function (req, res, next) {
    async([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
          //password reset is not relevant for oAuth accounts
            LocalAccount.findOne({ email: req.body.email, oauthProvider: "local_provider" }, function (err, user) {
                if (!user) {
                    var responseData = {};
                    responseData["loggedin"] = 0;
                    responseData["message"] = "Email not found or password cannot be reset";
                    responseData["error"] = "Password cannot be reset";
                    return res.render('user_account/forgot_password_message', {
                        response: responseData,
                        page_title: 'Email not found or password cannot be reset.',
                        page_description: "Please try again or contact us",
                        page_path: req.path,
                        page_type: "website",
                        loggedin: 0
                    });
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var request = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: helper.Mail(helper.Email('info@tickertape.cc'),
                    'Account Password Reset',
                    helper.Email(user.email),
                    helper.Content('text/html',
                        '<h2>Account password reset</h2>' +
                        'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'https://www.tickertape.cc/account/password_reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n' +
                        '<h3>&nbsp;-&nbsp;TICKERTAPE PASSWORD RESET BOT team</h3>')
                ).toJSON(),
            });
            //With callback
            sg.API(request, function (error, response) {
                if (error) {
                    console.log('Error response received');
                }
                console.log(response.statusCode)
                console.log(response.body)
                console.log(response.headers)
                req.flash('error', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                //The done function will complete this array of functions and the final handler below will run.
                done(error, 'done');
            });



        }
    ], function (err) {
        if (err) return next(err);
        var responseData = {};
        responseData["loggedin"] = 0;
        responseData["message"] = "An e-mail has been sent with further instructions";

        res.render('user_account/forgot_password_message', {
            response: responseData,
            page_title: 'password reset',
            page_description: "Password Reset",
            page_path: req.path,
            loggedin: 0
        });
    });
});

router.get('/password_reset/:token', 
// bruteforce.prevent, 
function (req, res) {
    LocalAccount.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            var responseData = {};
            responseData["loggedin"] = 0;
            responseData["message"] = "Email not found or password cannot be reset";
            responseData["error"] = "Password cannot be reset";

            res.render('user_account/forgot_password_message', {
                response: responseData,
                page_title: "Email not found or password cannot be reset",
                page_description: "Email not found or password cannot be reset",
                page_path: req.path,
                page_type: "website",
                loggedin: 0
            });
        }

        res.render('user_account/reset_password', {
            error: req.flash('error'),
            page_title: "Choose a new password",
            page_description: "Choose a new Password",
            page_path: req.path,
            page_type: "website",
            loggedin: 0
        });
    });
});

router.post('/password_reset/:token', 
// bruteforce.prevent, 
function (req, res) {
    async([
        function (done) {
            LocalAccount.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    var responseData = {};
                    responseData["loggedin"] = 0;
                    responseData["message"] = "Password reset token is invalid or has expired.";
                    responseData["error"] = "Invalid token";

                    return res.render('user_account/forgot_password_message', {
                        response: responseData,
                        page_title: "Password cannot be reset",
                        page_description: "Password cannot be reset",
                        page_path: req.path,
                        page_type: "website",
                        loggedin: 0
                    });
                }

                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
                user.setPassword(req.body.password, function () { user.save(); console.log("Password reset: " + user.email) });
                user.save();

                user.save(function (err) {
                    req.logIn(user, function (err) {
                        done(err, user);
                    });
                });

            });
        },
        function (user, done) {
          //This needs a working sendgrid account. Or to be rewritten for your automated email setup.
            var request = sg.emptyRequest({
                method: 'POST',
                path: '/v3/mail/send',
                body: helper.Mail(helper.Email('info@tickertape.cc'),
                    'Your account password has been changed',
                    helper.Email(user.email),
                    helper.Content('text/html',
                        '<h2>Account password reset</h2>' +
                        'This is a confirmation that the password for account ' + user.email + ' has just been changed.\n' +
                        '<table border="0" cellspacing="5" style="width:100;margin:10px;background:#fff;border:1px solid #888; font-size:80%;">'+
                        '<tr style="border-bottom:1px solid #ccc; margin:3px 0;"><td style="font-weight:bold">Username:</td><td>'+user.username +'</td></tr>'+
                        '<tr style="border-bottom:1px solid #ccc; margin:3px 0;"><td style="font-weight:bold">Email:</td><td>'+user.email +'</td></tr>'+
                      '</table>'+ 
                        '<h3>&nbsp;-&nbsp;PASSWORD BOT</h3>'
                    )).toJSON(),
            });
            //Send the mail and pass control to the final handler below
            sg.API(request, function (error, response) {
                if (error) {
                    console.log('Error response received');
                }
                console.log(response.statusCode)
                console.log(response.body)
                console.log(response.headers)
                req.flash('success', 'Success! Your password has been changed.');
                done(error, 'done');
            });
        }
    ], function (err) {
        var responseData = {};
        responseData["loggedin"] = 0;
        responseData["message"] = "Password has been reset.";
        responseData["error"] = "";

        res.render('user_account/forgot_password_message', {
            response: responseData,
            page_title: "password reset",
            page_description: "password reset",
            page_path: req.path,
            page_type: "website",
            loggedin: 0
        });
    });
});

module.exports = router;