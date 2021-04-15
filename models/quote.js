var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var quote = new mongoose.Schema({
    created: { type: Date, default: Date.now },
    updated: Date,

    site:{type: String, trim: true},
    unitsize:{type: String, trim: true},

    pricePerMonth: Number,

    terms:{type: String, trim: true},
});

module.exports = mongoose.model('quote', quote);
