
const schmaName = require('../constants').schemas;
const mongoose = require('mongoose');
const schema = mongoose.Schema;
const schemaName = require('../constants').schemas;

var placeSchema = new schema({
    sportId:{ type: mongoose.Schema.Types.ObjectId, ref: schmaName.sport},
    address: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number] // [  ,<longitude>, <latitude> ]
    },
  
  
});

places = module.exports = mongoose.model(schemaName.place,placeSchema)