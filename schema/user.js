//for directors and teachers

const mongoose = require('mongoose');
const schema = mongoose.Schema;
const schemaName = require('../constants').schemas;
var userSchema = new schema({
    name: { type: String},
    email: { type: String},
    password: { type: String },
    contactNo: { type: String},
    imageUrl: { type: String },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
});

Users = module.exports = mongoose.model(schemaName.user, userSchema)