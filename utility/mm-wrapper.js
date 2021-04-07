var needle = require("needle");

const server_url = "mm.tickertape.cc";

module.exports = {

    getAvaliableUnits : function(callback){
            let post_data = {};

            needle("post","http://192.168.1.165:3000/api/v1/base/WGetSiteDetails", post_data, function(err, res) {
                if (err) {
                    //console.error(err);
                    callback(err);
                }else{
                    // console.log(res.body);
                    callback(null, res);
                }
            });
    },

	// getAvaliableUnits : function(){
    //     return new Promise(function(callback){
    //         let post_data = {};

    //         needle("post","http://192.168.1.165:3000/api/v1/base/WGetSiteDetails", {}, function(err, res) {
    //             if (err) {
    //                 //console.error(err);
    //                 callback(err);
    //             }else{
    //                 // console.log(res.body);
    //                 callback(res);
    //             }
    //         });

    //         // needle
    //         // // .post(`https://${server_url}/api/v1/base/WGetSiteDetails`, post_data, { multipart: true })
    //         // // .get(`https://${server_url}/api/v1/base/WGetSiteDetails`)
    //         // .get("https://mm.tickertape.cc/api/v1/base/WGetSiteDetails")
    //         // .on("done", function(err, reply) {
    //         //     console.log("20");
    //         //     if(err){
    //         //         console.log("21");
    //         //         callback(err);
    //         //     }else{
    //         //         console.log("22");
    //         //         callback(null, reply);
    //         //     }
    //         // });
    //     });
    // },

    testing : function(){
            needle("post","http://192.168.1.165:3000/api/v1/base/WGetSiteDetails", {}, function(err, res) {
                if (err) {
                    console.error(err);
                };
                console.log(res.body);
            });
    },



    //Function template for the promise responses
    // getAsyncData : function (someValue){
    //     return new Promise(function(resolve, reject){
    //         getData(someValue, function(error, result){
    //             if(error){
    //                 reject(error);
    //             }
    //             else{
    //                 resolve(result);
    //             }
    //         })
    //     });
    // }


};//module