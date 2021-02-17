const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const eventdao = require('./eventDao');
const event = require('../schema/event');
// const { options } = require('./eventRouter');
const user = require('../schema/user');
const userService = require('../user/userService');


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
    return eventdao.create(data).then((response) => {
        res.json({ code: code.created, eventId: response._id, message: msg.eventcreated })
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
    var sorttype = '';
    let query = {};
    let radius = (req.query.radius) ? req.query.radius : 100;
    (req.query.date) ? (query.date = req.query.date + "T00:00:00.000Z") : '';
    if (req.query.order == "Asce") {
        sorttype = -1
    } else if (req.query.order == "Desc") {
        sorttype = 1
    } else {
        sorttype = '';
    }
    (req.query.long && req.query.lat) ? query.location = {
        $nearSphere: {
            $geometry: {
                type: 'Point',
                coordinates: [req.query.long, req.query.lat]
            },
            $maxDistance: parseFloat(radius) * 1000
        }
    } : '';
    (req.body.level) ?
        query.level = { $in: req.body.level } : '';
    (req.body.sport) ? query.sport = { $in: req.body.sport } : '';
    console.log("eventlist -> query", query);


    return event.find(query).populate('participants', '_id imageUrl firstname lastname')
        .sort({ starttime: sorttype }).then((data) => {
            console.log("eventlist -> data", data.length)
            if (data.length == 0) {
                res.json({ code: code.ok, data: data })
            }
            data.map((el, inx) => {
                if (el.participants.length >= 1) {
                    el.participants.map((par, i) => {
                        console.log("eventlist -> par", par)
                        let obj = {
                            ...par._doc,
                            friend: false
                        }
                        el.participants[i] = obj
                    })
                }

                if ((data.length - 1) == inx) {
                    res.json({ code: code.ok, data: data })
                }
            })
        }).catch((err) => {
            console.log("eventlist -> err========================>", err)
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })
}
function joinevent(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { _id: req.query.eventId },
        update = { $push: { participants: obj.id } },
        options = { new: true };
    eventdao.findone(query).then((data) => {
        if ((data.participants.length + 1) == data.seats || (data.participants.length + 1) > data.seats) {
            return res.json({ code: code.badRequest, msg: msg.eventfull })
        } else {
            return eventdao.findOneAndUpdate(query, update, options).then((data) => {
                // console.log("joinevent -> data===============================", data.participants.length, data.seats,data.createdby)
                if (data.participants.length == data.seats) {
                    userService.eventfullnotification(data.createdby, data.id)

                }

                userService.joinevent(data.createdby, obj.id, data.id)//creatorsid,usersid,eventsid
                 res.json({ code: code.ok, msg: msg.eventjoin })
            })
        }
    }).catch((err) => {
        console.log("joinevent -> err", err)
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
        console.log("preferenceBasedList -> data.preferences", data.preferences, data.preferences.length)
        if (data.preferences.length >= 1) {
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

                event.find(query).populate('participants', '_id imageUrl firstname lastname').then((eventdata) => {
                    (eventdata[0] != null) ? eventlist.push(eventdata[0]) : '';
                    if (index == (data.preferences.length - 1)) {
                        res.json({ code: code.ok, data: eventlist })
                    }
                })
            })
        } else if (data.preferences == 0) {
            console.log("preferenceBasedList ->  else if")
            this.eventlist(req, res)
            // res.json({ code: code.ok, data: eventlist })
        } else {

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