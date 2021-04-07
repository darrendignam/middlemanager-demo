var needle = require("needle");

const server_url = "mm.tickertape.cc";

module.exports = {
	getAvaliableUnits : function(){
        return new Promise(function(callback){
            let post_data = {};
            console.log("2");

            needle
            // .post(`https://${server_url}/api/v1/base/WGetSiteDetails`, post_data, { multipart: true })
            // .get(`https://${server_url}/api/v1/base/WGetSiteDetails`)
            .get("https://mm.tickertape.cc/api/v1/base/WGetSiteDetails")
            .on("done", function(err, reply) {
                console.log("20");
                if(err){
                    console.log("21");
                    callback(err);
                }else{
                    console.log("22");
                    callback(null, reply);
                }
            });
        });
    },

    testing : function(){
            console.log("2");
            // needle.get("https://mm.tickertape.cc/api/v1/base/WGetSiteDetails")
            // .on("done", function(err, reply) {
            //     console.log("20");
            //     if(err){
            //         console.log("21");
            //         console.log(err);
            //     }else{
            //         console.log("22");
            //         console.log(reply);
            //     }
            // });

            needle("post","https://mm.tickertape.cc/api/v1/base/WGetSiteDetails", {data : "data"}, {content_type : "application/x-www-form-urlencoded"}, function(error, response) {
                console.log("4");
                console.log(response);
                // if (!error && response.statusCode == 200){
                //     console.log(response);
                // }else{
                //     console.log(error);
                // }
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