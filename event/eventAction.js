const service = require('./eventService')
// const userService=require('../user/userService')


function addevent(req, res,next) {
    service.addevent(req, res,next)
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





module.exports = {
    addevent,
    eventdetail,
    myevents,
    eventlist
}