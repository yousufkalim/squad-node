const mongoose = require('mongoose');
const schema = mongoose.Schema;
const schmaName = require('../constants').schemas;
const status = require('../constants').staus;
var sportSchema = new schema({
   name:{type:String},
   status:{type:String,enum:[status.active,status.deactive]}
});


User = module.exports = mongoose.model(schmaName.sport, sportSchema)