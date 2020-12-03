// var express = require("express")
// var app = express();
// var mongoose = require("mongoose")
// const morgan = require('morgan');
// var bodyParser = require('body-parser')
// var cors = require('cors')
// var env = require('dotenv').config()
// app.use(cors({credentials: true, origin: true}))
// app.use(express.static('./img'));
// app.use(bodyParser.json({ limit: '10mb', extended: true }))
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
// mongoose.connect(process.env.DBURL, function (err) {
//     if (err) {
//         console.log("err-----------------------------------------", err)

//     }
// });
// app.use(morgan('combined'));
// const port = process.env.PORT;
// console.log('Magic happens on port', process.env.PORT);
// var server = app.listen(port);
// require('./router')(app)
// app.set('views', './views');
// app.set('view-engine', 'jade');
// const http = require('http');
// const io = require("socket.io")(http, {
//     cors: {
//       origin: "http://localhost:4200/",
//       methods: ["GET", "POST"]
//     }
//   });
// require('./socket/socketHandler')(io)
// const express = require("express")
// const app = express();
// const mongoose = require("mongoose")
// const morgan = require('morgan');
// const bodyParser = require('body-parser')
// var cors = require('cors')
// const env = require('dotenv').config()
// app.use(cors({credentials: true, origin: true}))
// app.use(bodyParser.json({ limit: '10mb', extended: true }))
// app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
// mongoose.connect(process.env.DBURL)
// app.use(morgan('combined'));
// app.use(express.static('./img'));
// require('./router')(app)
// app.set('views', './views');
// app.set('view-engine', 'jade');
// const http = require('http');
// const chat = require("./schema/chat");
// const port = process.env.PORT;
// console.log('Magic happens on port', process.env.PORT);
// var server = app.listen(port);
// var router = express.Router();
// const customerDao = require('./customer/customerDao');
// const { accountType } = require("./constants");
// const whitelist = ['http://localhost:4200'];
// var socket = require('socket.io')(http);
// const io = socket.listen(server)
// require('./socket/socketHandler')(io)
const express = require("express")
const app = express();
const mongoose = require("mongoose")
const morgan = require('morgan');
const bodyParser = require('body-parser')
var cors = require('cors')
const env = require('dotenv').config()
app.use(cors({credentials: true, origin: true}))
app.use(bodyParser.json({ limit: '10mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
// mongoose.connect(process.env.DBURL)
mongoose.connect(process.env.DBURL, function (err) {
    if (err) {
        console.log("err-----------------------------------------", err)

    }
});
app.use(morgan('combined'));
app.use(express.static('./img'));
require('./router')(app)
app.set('views', './views');
app.set('view-engine', 'jade');
const http = require('http');
const chat = require("./schema/chat");
const port = process.env.PORT;
console.log('Magic happens on port', process.env.PORT);
var server = app.listen(port);
var router = express.Router();
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