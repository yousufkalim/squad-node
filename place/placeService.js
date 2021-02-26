const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const placedao = require('./placeDao');
const eventdao = require('../event/eventDao');
function addplace(req, res) {
    const data = req.body
    const { sportId, location } = req.body;
    let query = {
        $and: [{
            'sport': sportId
        },
        {
            'placeId': null
        },
        ]
    }
    return placedao.create(data).then((data) => {
        eventdao.find(query).then((eventdata) => {
            var eventIds = []
            eventdata.map((eve, eindex) => {
                if (eve.location.coordinates[0].toFixed(4) == location.coordinates[0].toFixed(4) &&
                    eve.location.coordinates[1].toFixed(4) == location.coordinates[1].toFixed(4)) {
                    eventIds.push(eve._id)
                }
                if (eventdata.length == (eindex + 1)) {
                    //function for update placeId in particular event
                    addplaceevent(eventIds, data._id)
                    console.log("addplace -> eventIds", eventIds)
                }
            })
        })
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
function addplaceevent(events, placeid) {

    events.map((eve) => {
        let query = {
            _id: eve
        },
            update = { $set: { placeId: placeid } },
            options = { new: true };
        eventdao.findOneAndUpdate(query, update, options).then((data) => {
            console.log("addplaceevent -> data", data)

        }).catch((err) => {
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })

    })
}
module.exports = {
    addplace,
    placelist,
    addRating,
    addplaceevent

}