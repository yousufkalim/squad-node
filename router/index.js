var adminRouter = require('../admin/adminRouter')
var commonRouter = require('../common/commonRouter')
var userRouter = require('../user/userRouter')
var sportRouter = require('../sport/sportRouter')
const path = require('path')
var express = require('express');


module.exports = function (app) {
    app.use('/admin', adminRouter)
    app.use('/sport', sportRouter)
    app.use('/user', userRouter)
    app.use('/', commonRouter)
    app.use('/test', (req, res) => {
        return res.json({ msg:"test api response" })
    })

}