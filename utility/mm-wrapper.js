//Node Package that replaces the old 'request' package. a wrapper for the low level http and https objects 
var needle = require("needle");

//Useful tool to manage groups of async function calls
var async = require('async-waterfall');

const server_url = process.env.MIDDLEMANAGER_URL;

var needle_options = {
    compressed: true,
    accept: 'application/json',
    content_type: 'application/x-www-form-urlencoded',
    open_timeout: 5000, //max 5 second timeout
};

/**
 * Wrapper to simplify using needle
 * 
 * @param {string} api_function - which api function call you want to call against the middlemanager api
 * @param {object} post_data - Object that will become the post vars. Use and empty object {} for post with no vars
 * @param {callback} callback_function - error and response
 */
let post_wrapper = function(api_function, post_data, callback){
    needle.post(`${server_url}${api_function}`, post_data, needle_options, function(err, res) {
        if (err) 
        {
            callback(err);
        }
        else if(res.statusCode != 200)
        {
            callback({
                "error": "Not Found",
                "type": "404",
                "number":404,
            });
        }
        else if(res.body.error)
        {
            callback(res.body);
        }
        // The condition below creates an error from the wrong content-type header. This is not always strictly an error. But it might make things easier to enable it
        // else if(res.headers["content-type"] && res.headers["content-type"].indexOf("application/json") == -1 ){
        //     callback({
        //         "error": "Response not JSON",
        //         "response": res.body
        //     });
        // }
        else
        {
            callback(null, res.body);
        }
    });
}

module.exports = {

    //helper function for needle calls

    /**
     * Wrapper to simplify using needle
     * 
     * @param {string} api_function - which api function call you want to call against the middlemanager api
     * @param {object} post_data - Object that will become the post vars. Use and empty object {} for post with no vars
     * @param {callback} callback_function - error and result
     */
    post_request : post_wrapper,

    /**
     * This helper function will perform a cascade of API calls and build an object representing the current sites and units and prices
     * 
     * @param {callback} callback - error and result
     */
    getAllAvaliableUnits : function(callback){
        this.post_request("/api/v1/base/WGetSiteDetails", {}, (err, reply)=>{
            if(err){
                callback(err);
            }else{
                //returns an array, so we need the array async-waterfall here to process each site in turn
                async([function initializer(initArray) {
                    initArray(null, []);//prep an empty array for us to work with (in resultsArray)
                }].concat(reply.map(function (site) {
                    return function (resultsArray, nextCallback) {
                        // console.log("Site: " + site.siteid);
                        post_wrapper("/api/v1/base/WAvailableUnits", { "iSite" : site.siteid }, (err, units)=>{
                            if(err){
                                nextCallback(err); //something went wrong, could try to recover, but lets just err out
                            }else{
                                //need to do some more processing here, or when all the callbacks have completed
                                //For now just make a single huge object

                                //reduce units array to unique SizeCodeIDs - could be smarter here and check the pricing too?
                                let tmp_results = [];
                                let hash = [];
                                for(let i =0; i < units.length; i++){
                                    if(!hash.includes(units[i].SizeCodeID)){
                                        hash.push(units[i].SizeCodeID);
                                        tmp_results.push(units[i]);
                                    }
                                }

                                let tmp_obj = { "name" : site.SiteName, "details": site ,"units" : tmp_results }; 
                                resultsArray.push(tmp_obj);
                                // console.log( resultsArray );
                                nextCallback(null, resultsArray);
                            }
                        });

                    }
                })), function (err, finalResult) {
                    if(err){
                        callback(err); //something went wrong, could try to recover, but lets just err out
                    }else{
                        callback(null, finalResult); //send the result of looping over the sites to the outer async, for final result processing
                    }
                });
            }
        });
    },


    /**
     * This helper function will perform a cascade of API calls and build an object representing the current sites and units and prices
     * 
     * @param {callback} callback - error and result
     */
     getAllAvaliableUnitsVerbose : function(callback){
        this.post_request("/api/v1/base/WGetSiteDetails", {}, (err, reply)=>{
            if(err){
                callback(err);
            }else{
                //returns an array, so we need the array async-waterfall here to process each site in turn
                async([function initializer(initArray) {
                    initArray(null, []);//prep an empty array for us to work with (in resultsArray)
                }].concat(reply.map(function (site) {
                    return function (resultsArray, nextCallback) {
                        // console.log("Site: " + site.siteid);
                        post_wrapper("/api/v1/base/WAvailableUnits", { "iSite" : site.siteid }, (err, units)=>{
                            if(err){
                                nextCallback(err); //something went wrong, could try to recover, but lets just err out
                            }else{
                                let tmp_obj = { "name" : site.SiteName, "details": site ,"units" : units }; 
                                resultsArray.push(tmp_obj);
                                // console.log( resultsArray );
                                nextCallback(null, resultsArray);
                            }
                        });

                    }
                })), function (err, finalResult) {
                    if(err){
                        callback(err); //something went wrong, could try to recover, but lets just err out
                    }else{
                        callback(null, finalResult); //send the result of looping over the sites to the outer async, for final result processing
                    }
                });
            }
        });
    },

    /**
     * Send iSite and/or iSize parameters to the API server.
     * 
     * @param {object} post_data - Object {"iSite":"id", "iSize":"id"} that will become the post vars. iSize is optional
     * @param {callback} callback_function- error and result
     */
    getAvaliableUnits : function(post_data, callback){
        this.post_request("/api/v1/base/WAvailableUnits", post_data, callback);
    },

    /**
     * Send object parameters to the API server to create new Space Manager Customer.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/base/WAddCustomer) 
     * @param {callback} callback_function- error and result
     */
    addCustomer : function(post_data, callback){
        this.post_request("/api/v1/base/WAddCustomer", post_data, callback);
    },

    /**
     * Send object parameters to the API server to create new contract.
     * This is an 'extended' function, as the middleware is doing a set of 'W' functions before returning a 
     * result.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/extended/CreateNewContract) 
     * @param {callback} callback_function- error and result
     */
     createNewContract : function(post_data, callback){
        this.post_request("/api/v1/extended/CreateNewContract", post_data, callback);
    },

    /**
     * Send object parameters to the API server to create new SM customer and generate a reservation.
     * 
     * @param {object} post_data - Object (See https://mm.tickertape.cc/api/v1/base/WAddCustomerWithReservation) 
     * @param {callback} callback_function- error and result
     */
    addCustomerWithReservation : function(post_data, callback){
        this.post_request("/api/v1/base/WAddCustomerWithReservation", post_data, callback);
    },

    /**
     * Simple test function, just to make sure the API is running.
     * Will return immediatly and write is results into the node console.
     */
    testing : function(){
            needle("post",`${server_url}$/api/v1/base/WGetSiteDetails`, {}, function(err, res) {
                if (err) {
                    console.error(err);
                };
                console.log(res.body);
            });
    },

    // getAllAvaliableUnitsLong : function(callback){
    //     // async-waterfall the err,results through this chain of lookups 
    //     async([
    //         (done) => {
    //             this.post_request("/api/v1/base/WGetSiteDetails", {}, done);//Get array of all sites from SpaceManager 
    //         },
    //         (sites, done)=>{
    //             //returns an array (in sites), so we need the array async-waterfall here to get the proces
    //             async([function initializer(firstMapFunction) {
    //                 firstMapFunction(null, []);//prep an empty array for us to work with (in resultsArray)
    //             }].concat(sites.map(function (site) {
    //                 return function (resultsArray, nextCallback) {

    //                     post_wrapper("/api/v1/base/WAvailableUnits", { "iSite" : site.siteid }, (err, result)=>{
    //                         if(err){
    //                             nextCallback(err); //something went wrong, could try to recover, but lets just err out
    //                         }else{
    //                             //need to do some more processing here, or when all the callbacks have completed
    //                             //For now just make a single huge object
    //                             let tmp_obj = { "site" : site.SiteName, "details": site ,"units" : result }; 
    //                             resultsArray.push(tmp_obj);
    //                             nextCallback(null, resultsArray);
    //                         }
    //                     });

    //                 }
    //             })), function (err, finalResult) {//inner async
    //                 if(err){
    //                     done(err); //something went wrong, could try to recover, but lets just err out
    //                 }else{
    //                     done(finalResult); //send the result of looping over the sites to the outer async, for final result processing
    //                 }
    //             });
    //         }
    //     ],function(err, result){//outer async
    //         if(err){
    //             callback(err);
    //         }else{
    //             callback(null, result)
    //         }
    //     });
    // },

};//module