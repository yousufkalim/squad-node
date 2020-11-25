var mongoose = require('mongoose')
var schema = mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    chatType: { type: String, enum: ['private', 'group'], default: 'private' },
    groupName: { type: String, required: function () { if (this.chatType == "group") return (this.chatType) ? true : false } },
})
module.exports = mongoose.model('roomSchema', schema);


























