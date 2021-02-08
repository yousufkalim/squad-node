const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const eventdao = require('./eventDao');
const event = require('../schema/event');
// const { options } = require('./eventRouter');
const user = require('../schema/user');

function addeventunauthorized(req, res) {
    const data = req.body;
    console.log("addevent -> data==============================>", data)
    return eventdao.create(data).then((response) => {
        res.json({ code: code.created, message: msg.eventcreated })
    }).catch((err) => {
        console.log("addevent -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function addevent(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    req.body.createdby = obj.id
    const data = req.body;
    console.log("addevent -> data==============================>", data)
    return eventdao.create(data).then((response) => {
        res.json({ code: code.created, message: msg.eventcreated })
    }).catch((err) => {
        console.log("addevent -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function updateevent(req, res) {
    let query = { _id: req.query.eventId },
        update = { $set: req.body },
        options = { new: true }
    return eventdao.findOneAndUpdate(query, update, options).then((result) => {
        return res.json({ code: code.ok, data: result })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventdetail(req, res) {
    console.log("eventdetail -----------------------------", req.query.eventId)
    let query = { _id: req.query.eventId }
    return eventdao.findone(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function myevents(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { createdby: obj.id }
    return eventdao.find(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventlist(req, res) {
    console.log("eventlist -> req.query.order", req.query.order)
    let query = (req.query.date) ? { date: req.query.date } : {};
    if (req.query.order == "Asce") {
        var sorttype = -1
    } else if (req.query.order == "Desc") {
        var sorttype = 1
    } else {
        var sorttype = '';
    }

    return event.find(query).sort({ starttime: sorttype }).then((data) => {
        // req, res
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        console.log("eventlist -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function joinevent(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { _id: req.query.eventId },
        update = { $push: { participants: obj.id } },
        options = { new: true };
    return eventdao.findOneAndUpdate(query, update, options).then((data) => {
        res.json({ code: code.ok, msg: msg.eventjoin })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventplayed(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { date: { "$lt": new Date(req.query.date) }, participants: { "$in": [obj.id] } };
    return eventdao.find(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventwillplayed(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { date: { "$gt": new Date(req.query.date) }, participants: { "$in": [obj.id] } };
    return eventdao.find(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function preferenceBasedList(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    var eventlist = [];
    user.findById(obj.id).then((data) => {
        console.log("preferenceBasedList -> data.preferences", data.preferences,data.preferences.length)
        if (data.preferences !=null) {
            console.log("preferenceBasedList -> if")
            data.preferences.map((el, index) => {
                let query = {//db.events.createIndex( {location: "2dsphere" } )
                    location: {
                        $nearSphere: {
                            $geometry: {
                                type: "Point",
                                coordinates: [data.location.coordinates[0], data.location.coordinates[1]]
                            },
                            $maxDistance: parseFloat(el.radius) * 1000
                        }
                    },

                    sport: el.sportId,
                    // level: { $in: el.level }

                    level:
                        { $eq: el.level }

                    // level: el.level

                };

                event.find(query).then((eventdata) => {
                    (eventdata[0] != null) ? eventlist.push(eventdata[0]) : '';
                    if (index == (data.preferences.length - 1)) {
                        res.json({ code: code.ok, data: eventlist })
                    }
                })
            })
        } else if (data.preferences == null) {
            console.log("preferenceBasedList ->  else if")
            this.eventlist(req, res)
            // res.json({ code: code.ok, data: eventlist })
        }else{
        
            console.log("===================in else=====================")
        }

    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })

    })
}
function eventinvitation(req, res) {
    console.log("eventinvitation", req.body)

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
    addeventunauthorized
}