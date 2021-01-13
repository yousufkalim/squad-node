const service = require('./eventService')
// const userService=require('../user/userService')


function addevent(req, res,next) {
    service.addevent(req, res,next)
}
function updateevent(req, res,next) {
    service.updateevent(req, res,next)
}
function eventdetail(req, res,next) {
    service.eventdetail(req, res,next)
}
function myevents(req, res,next) {
    service.myevents(req, res,next)
}
function eventlist(req, res,next) {
    service.eventlist(req, res,next)
}
function joinevent(req, res,next) {
    service.joinevent(req, res,next)
}
function eventplayed(req, res,next) {
    service.eventplayed(req, res,next)
}
function eventwillplayed(req, res,next) {
    service.eventwillplayed(req, res,next)
}

function eventinvitation(req, res,next) {
    service.eventinvitation(req, res,next)
}
module.exports = {
    addevent,
    eventdetail,
    myevents,
    eventlist,
    joinevent,
    eventplayed,
    eventwillplayed,
    eventinvitation,
    updateevent
}