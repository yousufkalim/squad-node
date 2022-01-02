const express = require("express")
const app = express();
const mongoose = require("mongoose")
const morgan = require('morgan');
const bodyParser = require('body-parser');
const eventservice = require('./event/eventService');
var device = require('express-device');
const cron = require('node-cron');
var cors = require('cors')
const env = require('dotenv').config()
app.use(device.capture());
app.use(cors({ credentials: true, origin: true }))
app.use(bodyParser.json({ limit: '10mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true }, function (err) {
    if (err) {
        console.log("err-----------------------------------------", err)

    } else {
        console.log("process.env.DBURL", process.env.DBURL)

    }
});
app.use(morgan('combined'));
app.use(express.static('./img'));
require('./router')(app)
app.set('views', './views');
app.set('view-engine', 'jade');
const http = require('http');
const chat = require("./schema/chat");
// const eventDao = require("./event/eventDao");
// const userDao = require("./user/userDao");
const port = process.env.PORT;
console.log('Magic happens on port', process.env.PORT);
var server = app.listen(port);
var router = express.Router();
// var ObjectId = require('mongodb').ObjectID;
// var io = require('socket.io').listen(server);
const whitelist = ['http://localhost:4200'];
//app.use(cors({credentials: true, origin: true}))
// app.use(cors({
// 	'allowedHeaders': ['Content-Type'],
// 	'origin': '*',
// 	'preflightContinue': true
// }));
var socket = require('socket.io')(http);
const io = socket.listen(server)
require('./socket/socketHandler')(io)

// cron.schedule('*/59 * * * *', function () {
//     console.log("<==========================running a task every  1 hour======================================>");
//     eventservice.twodaysbeforenotification()
//     eventservice.onedaysbeforenotification()
// });
// cron.schedule('* */1 * * *', function () {
//     console.log("<==========================running a task every  1 minute======================================>");
//     eventservice.oneminafternotification()
//     eventservice.eventhappennotification()
// });


