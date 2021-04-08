//Node Package that replaces the old 'request' package. a wrapper for the low level http and https objects 
var needle = require("needle");

//Useful tool to manage groups of async function calls
var async = require('async-waterfall');

// const server_url = "https://mm.tickertape.cc";
const server_url = "http://192.168.1.165:3000";

var needle_options = {
    compressed: true,
    accept: 'application/json',
    content_type: 'application/x-www-form-urlencoded'
};

let post_wrapper = async function(api_function, post_data, callback){
    needle.post(`${server_url}${api_function}`, post_data, needle_options, function(err, res) {
        if (err) {
            callback(err);
        }else{
            callback(null, res);
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
     * @param {callback} callback_function - error and result
     */
    getAllAvaliableUnits : function(callback){
        // async-waterfall the err,results through this chain of lookups 
        async([
            (done) => {
                this.post_request("/api/v1/base/WGetSiteDetails", {}, done);
            },
            (sites, done)=>{
                //returns an array (in sites.body), so we need the array async-waterfall here to get the proces
                async([function initializer(firstMapFunction) {
                    firstMapFunction(null, []);//prep an empty array for us to work with (in lastItemResult)
                }].concat(sites.body.map(function (site) {
                    return function (lastItemResult, nextCallback) {
                        //var itemResult = doThingsWith(arrayItem, lastItemResult);
                        //console.log(site);

                        post_wrapper("/api/v1/base/WAvailableUnits", { "iSite" : site.siteid }, (err, result)=>{
                            if(err){
                                nextCallback(err); //something went wrong, could try to recover, but lets just err out
                            }else{
                                //need to do some more processing here, or when all the callbacks have completed
                                //For now just make a single huge object
                                let tmp_obj = { "Site" : site.SiteName, "Units" : result.body }; 
                                lastItemResult.push(tmp_obj);
                                nextCallback(null, lastItemResult);
                            }
                        });

                    }
                })), function (err, finalResult) {//inner async
                    if(err){
                        done(err); //something went wrong, could try to recover, but lets just err out
                    }else{
                        done(finalResult); //send the result of looping over the sites to the outer async, for final result processing
                    }
                });
            }
        ],function(err, result){//outer async
            if(err){
                callback(err);
            }else{
                callback(null, result)
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

};//module