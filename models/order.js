var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var order = new mongoose.Schema({
    created: { type: Date, default: Date.now },
    updated: Date,

    site:{type: String, trim: true},
    unitsize:{type: String, trim: true},

    pricePerMonth: Number,

    owner_id: Schema.ObjectId,
    title: String,


    terms:{type: String, trim: true},
});

module.exports = mongoose.model('order', order);
