var adminRouter = require('../admin/adminRouter')
var commonRouter = require('../common/commonRouter')
var userRouter = require('../user/userRouter')
var sportRouter = require('../sport/sportRouter')
var eventRouter = require('../event/eventRouter')
var placeRouter = require('../place/placeRouter')
const path = require('path');
const eventservice = require('../event/eventService');
var express = require('express');
const userService = require('../user/userService')


module.exports = function (app) {
    app.use('/admin', adminRouter)
    app.use('/sport', sportRouter)
    app.use('/user', userRouter)
    app.use('/event', eventRouter)
    app.use('/location', placeRouter)
    app.use('/', commonRouter)
    app.use('/test', (req, res) => {
        return res.json({ msg: "Test api response" })
    })



    // eventservice.eventsnotification()
    // userService.ratenotification("e6QsI74mTn2BvQwlM-yAlx:APA91bHlttEnYjxpIHzOjOR9eoP_j05o99veXDpoVOqzB9zaoiiHTdiWcZ4hCCERg6_toDVBBiKV7oFjtL1WhVHtgh7wqqto08KsY-Jx-Z27qaqvrPAqAJ2YS2ovExY-Q3Ht89dMGTDW")
}