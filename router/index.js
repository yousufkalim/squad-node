// var adminRouter = require('../admin/adminRouter')
// var commonRouter = require('../common/commonRouter')
var userRouter = require('../user/userRouter')
const path = require('path')
var express = require('express');


module.exports = function (app) {
    // app.use('/admin', adminRouter)
    app.use('/user', userRouter)
    app.use('/test', (req, res) => {
        return res.json({ msg:"test api response" })
    })

}