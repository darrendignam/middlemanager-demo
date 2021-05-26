var express = require('express');
var router = express.Router();

var async = require('async-waterfall');

var mm = require('../utility/mm-wrapper');
var _unitData = require('../utility/unit-data');
var _unitSizecode = require('../utility/unit-sizecode');

const json2csv = require('json2csv').parse;

const fs = require('fs');
const multer = require('multer');
const csv = require('fast-csv');
const upload = multer({ dest: 'uploadedcsv/' });

//TODO: Put this into a unitilty module!
function formatDateYYYYMMDD(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}


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

router.get('/uploadcsv', function (req, res) {
  res.render("data/uploadcsv");
});

// req.file will contain the uploaded file information. 
router.post('/uploadcsv', upload.single('csvfile'), function (req, res) {
  // open uploaded file
  const fileRows = [];
  const validRows = [];
  const responseRows = [];

	if(req.file && req.file.path){
		csv.parseFile(req.file.path)
		.on("data", (data) => {
			fileRows.push(data); // push each row
		})
		.on("end", () => {
			// console.log(fileRows);
			fs.unlinkSync(req.file.path);   // remove temp file
			//process "fileRows" and respond
			
			// skip first row of labels... (i=1 not i=0 ;)
			for(let i = 1; i < fileRows.length; i++){
				if(fileRows[i].length > 0){
					//push each row into middlemanager API, and save the reponses into a result array
					validRows.push(fileRows[i]);

					// var date = new Date(fileRows[i][13]);
					// console.log( date.toString() );
					// console.log( formatDateYYYYMMDD( fileRows[i][13] ) );
				}
			}


			//process the discovered rows of the CSV through the reservation W function
			async([function initializer(initArray) {
				initArray(null, []);//prep an empty array for us to work with (in resultsArray)
			}].concat(validRows.map(function (new_reservation) {
				return function (resultsArray, nextCallback) {


					console.log( _unitSizecode( new_reservation[3] ) );

			//loop over the valid array items and try and push them into SM
					// Booking ID,	Reservation Transaction ID,	Reservation Amount Paid,	Container Size,	Container ID,	Duration,	First Name,	Surname,	Email,	Telephone,	Weekly Price,	Offer Price,	Offer Duration,	Moving In Date,	Billing Title,	Billing First Name,	Billing Surname,	Billing Email Address,	Billing Company Name,	Billing Address Line One,	Billing Address Line Two,	Billing Address Line Three,	Billing City,	Billing PostCode,	Correspondance Title,	Correspondance First Name,	Correspondance Surname,	Correspondance Email Address,	Correspondance Company Name,	Correspondance Address Line One,	Correspondance Address Line Two,	Correspondance Address Line Three,	Correspondance City,	Correspondance PostCode,	Car Registration,	Mobile,	SMS Consent,	Photo ID Document,	Address ID Document,	Authorised Persons,	Insurance Amount,	Insurance Price,	Insurance Declined,	Insurance Proof Document,	Insurance Type,	DD Name,	DD Sort Code,	DD Account Number,	DD Consent,	DD Declined,	eSignDocumentId,	Optional Extras,	Upfront Payment Amount,	Upfront Transaction ID,	Upfront Transaction Date,
					// 0            1                           2                           3               4               5           6           7           8       9           10              11              12              13              14              15                  16                  17                      18                      19                          20                          21                          22              23                  24                      25                          26                      27                              28                              29                                  30                                  31                                  32                      33                          34                  35      36              37                  38                      39                  40                  41                  42                  43                          44              45          46              47                  48          49              50                  51                  52                      53                      54                      
					let reservation_obj = {
						isite:      'RI1GRWXX250320060000',//no site so we make an assumption here it is the main location
						isurname:   new_reservation[16],
						iforenames: new_reservation[15],
						ititle:     new_reservation[14],
						iAdd1:       new_reservation[19],
						iAdd2:       new_reservation[20],
						iAdd3:       new_reservation[21],
						iTown:       new_reservation[22],
						iPostcode:   new_reservation[23],
						iemailaddress: new_reservation[8],
						Add1:       new_reservation[29],
						Add2:       new_reservation[30],
						Add3:       new_reservation[31],
						Town:       new_reservation[32],
						Postcode:   new_reservation[33],						
						// inumber:    req.body.phonenumber.replace('+','%2B'),
						imovein:    formatDateYYYYMMDD( new_reservation[13] ), //new_reservation[33] // need to convert this date to the correct format
						isizecode:  _unitSizecode(new_reservation[3]).SizeCodeID,
						idepositamt: new_reservation[2],
						ivatamt:    1,//meh, i dont know what to do here! 20% of a fiver is 1 right?
						// ipaymethod: req.body.ipaymethod,
						ipayref:    'creditcard',
						icomment:   [new_reservation[0], new_reservation[1], new_reservation[4], new_reservation[50], new_reservation[53], new_reservation[54]].join(', '),
					}
					mm.addCustomerWithReservation(reservation_obj, (err,result)=>{
						if(err){
							nextCallback(err);
						}else{
							resultsArray.push(result);
							nextCallback(null, resultsArray);
						}
					});

					
				}
			})), function (err, finalResult) {
				if(err){
					res.json(err); 
				}else{
					res.json(finalResult);
				}
			});
		});
	}
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
