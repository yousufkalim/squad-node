var express = require("express")
var app = express();
var mongoose = require("mongoose")
const morgan = require('morgan');
var bodyParser = require('body-parser')
var env = require('dotenv').config()
app.use(express.static('./img'));
app.use(bodyParser.json({ limit: '10mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
mongoose.connect(process.env.DBURL, function (err) {
    if (err) {
        console.log("err-----------------------------------------", err)

    }
});
app.use(morgan('combined'));
require('./router')(app)
app.set('views', './views');
app.set('view-engine', 'jade');
//for testing
module.exports = app.listen(process.env.PORT, () => {
    console.log(`server listening on ${process.env.PORT}`)
})