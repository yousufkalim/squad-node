const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const eventdao = require('./eventDao')
// const userdao = require('../user/userDao');
// const bcrypt = require('bcrypt');
// const crypto = require('crypto');
// const env = require('dotenv').config()

function addevent(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    req.body.createdby = obj.id
    const data = req.body;
    console.log("addevent -> data", data)
    return eventdao.create(data).then((response) => {
        console.log("addevent -> response", response)
        res.json({ code: code.created, message: msg.eventcreated })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventdetail(req, res) {
    console.log("eventdetail -----------------------------", req.query.eventId)
    let query = { _id: req.query.eventId }
    return eventdao.findone(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function myevents(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { createdby: obj.id }
    return eventdao.find(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventlist(req, res) {
    let query = { date: req.query.date }
    return eventdao.find(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

module.exports = {
    addevent,
    eventdetail,
    myevents,
    eventlist
}