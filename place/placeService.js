const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const placedao = require('./placeDao');

function addplace(req, res) {
    const data = req.body
    return placedao.create(data).then((data) => {
        res.json({ code: code.created, message: msg.placeadded })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function placelist(req, res) {
    let query = (req.query.sportId) ? { sportId: req.query.sportId } : {};
    return placedao.find(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        console.log("placelist -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

function addRating(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)
    const { rate, placeId } = req.body;
    let rating = {
        by: obj.id,
        ratedwith: rate
    }
    let query = { _id: placeId },
        update = { $push: { "rates": rating } },
        options = { new: true };
    placedao.findOneAndUpdate(query, update, options).then((userdata) => {
        (userdata.fcmToken) ? rateyounotification(userdata.fcmToken) : '';
        return res.json({ code: code.ok, msg: msg.addrate })
    }).catch((err) => {
        console.log("addRating -> err", err)
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}
module.exports = {
    addplace,
    placelist,
    addRating

}