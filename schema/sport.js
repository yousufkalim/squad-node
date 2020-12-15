const mongoose = require('mongoose');
const schema = mongoose.Schema;
const schmaName = require('../constants').schemas;
const status = require('../constants').status;
const level=require('../constants/index').level;
var sportSchema = new schema({
   name:{type:String},
   image:{type:String},
   status:{type:String,enum:[status.active,status.deactive],default:status.active},
   // capacity:{type:Number},
   // level:{type:String,enum:[level.beginner,level.intermediate,level.advanced]}
});


Sport = module.exports = mongoose.model(schmaName.sport, sportSchema)