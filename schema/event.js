const mongoose = require('mongoose');
const schema = mongoose.Schema;
const schmaName = require('../constants').schemas;
const level=require('../constants').level;
const gender=require('../constants').gender;
const eventType=require('../constants/index').eventType;
var eventSchema = new schema({
    sport: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.sport },
    level: { type: String, enum: [level.beginner,level.intermediate,level.advanced] },
    gender: { type: String, enum: [gender.men,gender.women,gender.both] },
    date: { type:Date},
    starttime: { type: Date },
    endtime: { type: Date },
    Address: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number] // [  ,<longitude>, <latitude> ]
    },
    //lat long
    price: { type: Number },
    seats: { type: Number },
    type:{type:String,enum:[eventType.private,eventType.public]},
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.user },
    participants:[{ type: mongoose.Schema.Types.ObjectId, ref: schmaName.user }] 
});


Event = module.exports = mongoose.model(schmaName.event, eventSchema)