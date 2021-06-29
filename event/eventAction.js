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
    service.joinevent2(req, res,next)
}
function eventplayed(req, res,next) {
    service.eventplayed(req, res,next)
}
function eventwillplayed(req, res,next) {
    service.eventwillplayed(req, res,next)
}
function preferenceBasedList(req, res,next) {
    service.preferenceBasedList(req, res,next)
}

function eventinvitation(req, res,next) {
    service.eventinvitation(req, res,next)
}
function addeventunauthorized(req, res,next) {
    service.addeventunauthorized(req, res,next)
}
function deleteevent(req, res,next) {
    service.deleteevent(req, res,next)
}
function unjoinevent(req, res,next) {
    service.unjoinevent(req, res,next)
}
function eventFCM(req, res, next){
    service.eventFCM(req, res, next)
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
    updateevent,
    preferenceBasedList,
    addeventunauthorized,
    deleteevent,
    unjoinevent,
    eventFCM
}