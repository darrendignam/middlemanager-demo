/**
 *   
 *   The module function performs a lookup converting textual size to sizecode
 * 
 */

 let sizes = {
    "Meduim":{
        Sizecode: "SC0150",
        SizeCodeID: "RI0ZFCRI08022018004L",
    },
    "Large":{
        Sizecode: "SC0300",
        SizeCodeID: "RI0ZDERI08022018004F",
    },
    "Small":{
        Sizecode: "SC0075",
        SizeCodeID: "RI141URI08022018005W",
    },
    "XSmall":{
        Sizecode: "SC0035",
        SizeCodeID: "RI0Z8IAB25052018000Q",
    },     

};

module.exports = (size)=>{
    if(sizes[size]){
        return sizes[size];
    }else{
        return {
            //Medium by default?? perhaps have some error handling!
            Sizecode: "SC0150",
            SizeCodeID: "RI0ZFCRI08022018004L",
        }
    }
};