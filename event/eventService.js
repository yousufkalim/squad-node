const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const eventdao = require('./eventDao');
const event = require('../schema/event');

const user = require('../schema/user');
const userService = require('../user/userService');

const userDao = require('../user/userDao');
const { gender } = require('../constants').gender;
const geolib = require('geolib');

function latlongtokm(userlong, userlat, eventlong, eventlang) {
    let km = geolib.getDistance(
        { latitude: userlong, longitude: userlat },
        { latitude: eventlong, longitude: eventlang }
    );
    return km

}
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
    console.log("addevent -> req.body=============================================================================================", req.body)
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
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { _id: req.query.eventId };
    user.findById(obj.id).then((userdata) => {
        return event.findOne(query).populate('participants', '_id imageUrl firstname lastname').then((data) => {
            if (data.participants && data.participants.length >= 1) {
                data.participants.map((par, i) => {
                    var fr = (userdata.friends) ? userdata.friends.includes(par.id) : false;
                    let obj = {
                        ...par._doc,
                        friend: fr
                    }
                    data.participants[i] = obj
                })
            }
            res.json({ code: code.ok, data: data })
        })
    })
        .catch((err) => {
            console.log("eventdetail -> err", err)
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })
}
function myevents(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    console.log(obj);
    let query = { createdby: obj.id }
    
    return event.find(query).sort({date: -1}).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventlist(req, res) {
    let query = {};
    // let radius = (req.query.radius) ? req.query.radius : 100;
    let token = req.headers['authorization']
    let user = util.decodeToken(token)
    var sorttype = '';
    var free = (req.query.free) ? req.query.free : 0;
    // var km = (req.query.km) ? req.query.km : 0;
    const { userdata } = req.body;
    if (req.query.sport)
        var sportfilter = req.query.sport;
    if (req.query.level)
        var levelfilter = req.query.level;
    if (req.query.km)
        var km = req.query.km;
    (req.query.date) ? (query.date = req.query.date + "T00:00:00.000Z") : '';
    return event.find(query).populate('participants', '_id imageUrl firstname lastname')
        .sort({ starttime: sorttype }).then((data) => {

            if (data.length == 0) {
                res.json({ code: code.ok, data: data })
            }
            data.map((el, inx) => {

                if (el.participants && el.participants.length >= 1) {

                    el.participants.map((par, i) => {
                        var fr = (userdata.friends) ? userdata.friends.includes(par._id) : false;
                        let obj = {
                            ...par._doc,
                            friend: fr
                        }
                        el.participants[i] = obj
                    })
                }

                if ((data.length - 1) == inx) {
                    let participantIds = []
                    data.map((el, i) => {
                        let kmobj = {
                            ...el,
                            distance: this.latlongtokm(userdata.location.coordinates[0], userdata.location.coordinates[1],
                                el.location.coordinates[0], el.location.coordinates[1])
                        }
                        console.log("preferenceBasedList -> kmobj", kmobj.distance)
                        var participatedinevent;
                        el.participants.map((ele) => {
                            participantIds.push(JSON.stringify(ele._id))
                        })

                        participatedinevent = (user.id) ? (participantIds.includes(JSON.stringify(user.id))) : false;
                        let obj = {
                            ...el._doc,
                            participatedinevent: participatedinevent,
                            seatsremain: el.seats - el.participants.length
                        }

                        data[i] = obj
                    })
                    if (free == 1) {
                        data.sort((a, b) => a.price - b.price);
                    }
                    if (levelfilter) {
                        let arr1 = [], arr2 = [];
                        data.map((el) => {
                            (levelfilter.includes(el.level)) ? arr1.push(el) : arr2.push(el);
                        })
                        data = arr1.concat(arr2);
                    }
                    if (sportfilter) {
                        let arr1 = [], arr2 = [];
                        data.map((el) => {
                            (sportfilter.includes(el.sport)) ? arr1.push(el) : arr2.push(el);
                        })
                        data = arr1.concat(arr2);
                    }
                    if (km) {
                        let arr1 = [], arr2 = [];
                        data.map((el) => {
                            (km == el.km) ? arr1.push(el) : arr2.push(el);
                        })
                        data = arr1.concat(arr2);
                    }
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
        if ((data.participants.length) == data.seats || (data.participants.length) > data.seats) {
            addeventfullNotification()
            return res.json({ code: code.badRequest, msg: msg.eventfull })
        } else {
            return eventdao.findOneAndUpdate(query, update, options).then((data) => {
                if (data.participants.length == data.seats) {
                    userService.eventfullnotification(data.createdby, data.id)
                }
                //have to event id in users as well
                let query1 = { _id: obj.id },
                    update1 = { $push: { participatedin: { eventId: data._id } } },
                    options1 = { new: true };
                userDao.findOneAndUpdate(query1, update1, options1).then((userdata) => {
                    if (userdata.participants) {

                        if ((userdata.participants.length + 1) == userdata.seats || (userdata.participants.length) > userdata.seats) {
                            addeventfullNotification(data._id, data.createdby)
                        }
                    }
                    //remove invitation notification  from particular sender
                    console.log("joinevent -> obj.id, req.query.senderId, req.query.eventId", obj.id, req.query.senderId, req.query.eventId);
                    (req.query.senderId) ? userService.removeJoineventInviteNotif(obj.id, req.query.senderId, req.query.eventId) : "";
                    addjoineventNotification(data._id, obj.id, data.createdby)
                    userService.joinevent(data.createdby, obj.id, data.id)//creatorsid,usersid,eventsid
                    res.json({ code: code.ok, msg: msg.eventjoin })
                })
            })
        }
    }).catch((err) => {
        console.log("joinevent -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function addjoineventNotification(eventId, userId, creatorId) {
    let joineventNotification = {
        eventId: eventId,
        userId: userId
    };

    let query = { _id: creatorId },
        update = { $push: { joineventNotification: joineventNotification } },
        options = { new: true };
    userDao.findOneAndUpdate(query, update, options).then((data) => {
        console.log("rateyou notification added -> data", data)

    }).catch((err) => {
        console.log("err", err)

    })
}
function addeventfullNotification(eventId, creatorId) {
    let eventfullNotification = {
        eventId: eventId,
    };

    let query = { _id: creatorId },
        update = { $push: { eventfullNotification: eventfullNotification } },
        options = { new: true };
    userDao.findOneAndUpdate(query, update, options).then((data) => {
        console.log("addeventfullNotification -> data", data)


    }).catch((err) => {
        console.log("err", err)

    })
}
function joinevent2(req, res) {
    console.log("req.body.starttime", req.body.starttime)
    let token = req.headers['authorization']
    let obj = util.decodeToken(token);
    let query = { _id: obj.id };
    let eventIdlist = [];
    user.findOne(query).then((data) => {
        if (data.participatedin.length == 0) {
            //join event
            this.joinevent(req, res)
            // res.json({ code: code.ok, message: "you can join event" })
        } else {
            data.participatedin.map((eventId, eindex) => {
                eventIdlist.push(eventId.eventId);
                if (data.participatedin.length == (eindex + 1)) {
                    let query = { _id: { $in: eventIdlist }, starttime: { $eq: new Date(req.body.starttime) } };
                    console.log("query", query)
                    event.find(query).then((eventdata) => {
                        console.log("eventdata====================>", eventdata.length)
                        if (eventdata.length == 0) {
                            this.joinevent(req, res)
                            // res.json({ code: code.ok, message: "you can join event" })
                        } else {
                            res.json({ code: code.badRequest, msg: msg.cannotjoinevent })
                        }

                    })

                }
            })

        }
    }).catch((err) => {
        console.log("joinevent -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function eventplayed(req, res) {
    //"avrratvanue" "avrratorganizer"
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { date: { "$lt": new Date(req.query.date) }, participants: { "$in": [obj.id] } };
    event.find(query).populate('placeId', '_id sportId rates')
        .populate('participants', '_id firstname lastname imageUrl friends rateasplayer rateasorganizer')
        .populate('createdby', '_id rateasorganizer').then((data) => {//
            // console.log("eventplayed -> data==================================>", data.length)
            if (data.length == 0) {
                return res.json({ code: code.ok, data: data })
            }
            data.map((events, index) => {
                var avrratvanue = 0,
                    avrratorganizer = 0

                //place average rate
                if (!events.placeId) {
                    avrratvanue = 0
                } else {
                    avrratvanue = 0;
                    events.placeId.rates.map((placerate, pindex) => {
                        avrratvanue += placerate.ratedwith
                        if (events.placeId.rates.length == (pindex + 1)) {
                            avrratvanue = avrratvanue / (pindex + 1)
                        }
                    })
                }

                events.createdby.rateasorganizer.map((organizerrate, oindex) => {
                    avrratorganizer += organizerrate.ratedwith
                    if (events.createdby.rateasorganizer.length == (oindex + 1)) {
                        data[index] = {
                            ...events._doc,
                            "avrratorganizer": avrratorganizer / (oindex + 1),
                            "avrratvanue": avrratvanue
                        }
                    }
                })


                //organizer average rate
                events.participants.map((userdata, i) => {
                    var fr = (userdata.friends) ? userdata.friends.includes(obj.id) : false,
                        rateasplayer = 0,
                        rateasorganizer = 0;
                    userdata.rateasplayer.map((rate) => {
                        rateasplayer += rate.ratedwith
                    })
                    userdata.rateasorganizer.map((rate) => {
                        rateasorganizer += rate.ratedwith
                    })
                    userdata = {
                        // ...userdata._doc,
                        _id: userdata._id,
                        firstname: userdata.firstname,
                        lastname: userdata.lastname,
                        imageUrl: userdata.imageUrl,
                        friend: fr,
                        rateasplayer: (rateasplayer / userdata.rateasplayer.length),
                        rateasorganizer: (rateasorganizer / userdata.rateasorganizer.length)
                    }
                    events.participants[i] = userdata;
                })
                if (data.length == (index + 1)) {
                    // console.log("eventplayed -> finallist", data)
                    return res.json({ code: code.ok, data: data })
                }
            })
        }).catch((err) => {
            console.log("eventplayed -> err", err)
            return res.json({ code: code.ineternalError, message: msg.internalServerError })
        })
}
function eventwillplayed(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { date: { "$gt": new Date(req.query.date) }, participants: { "$in": [obj.id] } };
    console.log("query====================>", query)
    let mysort={date:-1}
    return event.find(query).sort(mysort).populate('placeId', '_id sportId').populate('participants', '_id firstname lastname imageUrl friends rateasplayer rateasorganizer').then((data) => {
        console.log("eventwillplayed -> !data", data.length)
        if (data.length == 0) {
            return res.json({ code: code.ok, data: data })
        }
        data.map((events, index) => {
            events.participants.map((userdata, i) => {
                var fr = (userdata.friends) ? userdata.friends.includes(obj.id) : false,
                    rateasplayer = 0,
                    rateasorganizer = 0;
                userdata.rateasplayer.map((rate) => {
                    rateasplayer += rate.ratedwith
                })
                userdata.rateasorganizer.map((rate) => {
                    rateasorganizer += rate.ratedwith
                })
                userdata = {
                    // ...userdata._doc,
                    _id: userdata._id,
                    firstname: userdata.firstname,
                    lastname: userdata.lastname,
                    imageUrl: userdata.imageUrl,
                    friend: fr,
                    rateasplayer: (rateasplayer / userdata.rateasplayer.length),
                    rateasorganizer: (rateasorganizer / userdata.rateasorganizer.length)
                }
                events.participants[i] = userdata;
            })
            if (data.length == (index + 1)) {
                // console.log("eventplayed -> finallist", data)
                return res.json({ code: code.ok, data: data })
            }
        })
    }).catch((err) => {
        console.log("eventwillplayed -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

function preferenceBasedList(req, res) {
    // console.log('-----------hello----------')
    let token = req.headers['authorization']
    let userToken = util.decodeToken(token)
    
    // var free = (req.query.free) ? req.query.free : 0;
    // if (req.query.level)
        // var levelfilter = req.query.level;
    // if (req.query.sport)
        // var sportfilter = req.query.sport;
        // if (req.query.km)
        // var km = req.query.km;
        // console.log(req.query.level)
        // return
    user.findById(userToken.id).then((userdata) => {
        if (userdata.preferences.length >= 1) {
            const promiseArray = userdata.preferences.map(function (el) {
                return new Promise(function (resolve, reject) {
                    //let query = {//db.events.createIndex( {location: "2dsphere" } )
                        // location: {
                        //     $nearSphere: {
                        //         $geometry: {
                        //             type: "Point",
                        //             coordinates: [userdata.location.coordinates[0], userdata.location.coordinates[1]]
                        //         },
                        //         $maxDistance: parseFloat(el.radius) * 1000
                        //     }
                        // },
                        //sport: el.sportId,
                        //level: { $in: [el.level, "ALL"] },// el.level,
                        //gender: { $in: [userdata.gender, "BOTH"] }
                    // }; 


                   // (req.query.date) ? (query.date = req.query.date + "T00:00:00.000Z") : ''; 
                    let query ={}

                    var km = 1000000
                    if(req.query.km){
                        var km = parseInt(req.query.km) * 1000
                    }
                    query.location = {
                        $nearSphere: {
                            $geometry: {
                                type: "Point",
                                coordinates: [userdata.location.coordinates[0], userdata.location.coordinates[1]]
                            },
                            $maxDistance: parseFloat(el.radius) * km
                        }
                    }
                    if(req.query.free){
                        query.price = 0
                    }
                    if(req.query.sport){
                        query.sport = {$in: [req.query.sport]}
                    }
                    if(req.query.level){
                        if(req.query.level == 'ALL'){
                            query.level = {$in: ['BEGINNER', 'INTERMEDIATE', 'ALL', ]} 
                        }
                        query.level = {$in: [req.query.level]}
                    }
                    if(req.query.date)
                    {
                        var start = new Date(req.query.date + "T00:00:00.000Z");
                        var end = new Date(req.query.date + "T23:59:59.000Z");
                         query.date =  {$gte: start, $lt: end};  
                    }
                    
                    // if(req.query.gender){
                    //     if(!Array.isArray(req.query.gender)){
                    //         req.query.gender = [req.query.gender]
                    //     }
                    //     // const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
                    //     // if(equals(req.query.gender, ['MEN', 'WOMEN'])){
                    //     if(req.query.gender[1]){
                    //         query.gender = {$in: ['BOTH']}
                    //     } else {
                    //         query.gender = {$in: req.query.gender}
                    //     }
                    // }

                    // console.log(query, userdata.location.coordinates[0], userdata.location.coordinates[1])
                    // console.log(req.query, '==================data==================')
                    // return
                    event.find(query).populate('participants', '_id imageUrl firstname lastname').then((data) => {
                        // resolve(eventdata)
                        // console.log(data, '=====================first')
                        if (data[0] != null) {
                            data.map((el, inx) => {
                                
                                if (el.participants && el.participants.length >= 1) {
                                    el.participants.map((par, i) => {
                                        var fr = (userdata.friends) ? userdata.friends.includes(par._id) : false;
                                        let obj = {
                                            ...par._doc,
                                            friend: fr
                                        }
                                        el.participants[i] = obj
                                    })
                                }
                                if ((data.length - 1) == inx) {
                                    let participantIds = []
                                    data.map((el, xl) => {

                                        // let kmobj = {
                                            
                                        // }
                                        // data[xl] = kmobj
                                        // console.log("preferenceBasedList -> kmobj", kmobj.distance)
                                        
                                        var participatedinevent;
                                        el.participants.map((ele) => {
                                            participantIds.push(JSON.stringify(ele._id))
                                        })
                                        participatedinevent = (participantIds) ? (participantIds.includes(JSON.stringify(userToken.id))) : false;

                                        let obj = {
                                            ...el._doc,
                                            participatedinevent: participatedinevent,
                                            seatsremain: el.seats - el.participants.length,
                                            distance: latlongtokm(userdata.location.coordinates[0], userdata.location.coordinates[1],
                                                el.location.coordinates[0], el.location.coordinates[1])
                                        }

                                        data[xl] = obj

                                      })
                                      
                                }

                                if (data.length == (inx + 1)) {
                                    res.json({ code: code.ok, data: data })
                                }
                                
                                
                            })

                        } else {

                            res.json({ code: code.notFound, data: [] })

                        }
                    }).catch((err) => {
                        reject(err)
                    })
                });
            });

        } else if (userdata.preferences.length == 0) {
            req.body.userdata = userdata;
            this.eventlist(req, res)
        }
    }).catch((err) => {
        console.log("preferenceBasedList -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })

    })
}




function eventinvitation(req, res) {
    console.log("eventinvitation", req.body)

}
function twodaysbeforenotification() {
    const currentDate = new Date();
    const afterTwoDaysDate = currentDate.addDays(2);//greater than this
    const afterTwoDaysDateOneHour = afterTwoDaysDate.addHours(1);//less than this
    // console.log("twodaysbeforenotification ->currentDate afterTwoDaysDate afterTwoDaysDateOneHour", currentDate, afterTwoDaysDate, afterTwoDaysDateOneHour)
    event.find({ "starttime": { $gt: afterTwoDaysDate, $lt: afterTwoDaysDateOneHour } }).then((eventlist) => {
        // console.log("twodaysbeforenotification -> eventlist", eventlist)
        eventlist.map((eve) => {
            addeventafterhourNotification(48, eve._id, eve.createdby)
            userService.eventhournotification(eve.createdby, 48)
        })
    }).catch((err) => {

    })
}
function onedaysbeforenotification() {
    const currentDate = new Date();
    const afterOneDaysDate = currentDate.addDays(1);//greater than this
    const afterOneDaysDateOneHour = afterOneDaysDate.addHours(1);//less than this
    // console.log("onedaysbeforenotification ->currentDate afterOneDaysDate  afterOneDaysDateOneHour", currentDate, afterOneDaysDate, afterOneDaysDateOneHour)
    event.find({ "starttime": { $gt: afterOneDaysDate, $lt: afterOneDaysDateOneHour } }).then((eventlist) => {
        // console.log("onedaysbeforenotification -> eventlist", eventlist)
        eventlist.map((eve) => {
            addeventafterhourNotification(24, eve._id, eve.createdby)
            userService.eventhournotification(eve.createdby, 24)
        })
    }).catch((err) => {

    })
}
function addeventafterhourNotification(hours, eventId, creatorId) {
    let eventafterhourNotification = {
        eventId: eventId,
        hours: hours
    };

    let query = { _id: creatorId },
        update = { $push: { eventafterhourNotification: eventafterhourNotification } },
        options = { new: true };
    userDao.findOneAndUpdate(query, update, options).then((data) => {
        console.log("rateyou notification added -> data", data)

    }).catch((err) => {
        console.log("err", err)

    })
}
function oneminafternotification() {
    const currentDate = new Date();
    const beforeOneminutedate = currentDate.removeMinutes(1);
    event.find({ "endtime": beforeOneminutedate }).then((eventlist) => {
        // console.log("oneminafternotification -> eventlist", eventlist)
        eventlist.map((eve) => {
            addrateplayerNotification(eve._id, eve.createdby)
            userService.ratenotification(eve.participants)
            userService.rateplayernotification(eve.createdby, eve._id)
        })
    }).catch((err) => {

    })
}
function addrateplayerNotification(eventId, creatorId) {//this will add into creator of event
    let rateplayerNotification = {
        eventId: eventId,
    };
    let query = { _id: creatorId },
        update = { $push: { rateplayerNotification: rateplayerNotification } },
        options = { new: true };
    userDao.findOneAndUpdate(query, update, options).then((data) => {
        console.log("addrateplayerNotification -> data", data)
    }).catch((err) => {
        console.log("err", err)
    })
}
function addrateallNotification(eventId, participantIds) {//this will add into creator of event
    participantIds.map((usr) => {
        let rateallNotification = {
            eventId: eventId,
        };
        let query = { _id: usr },
            update = { $push: { rateallNotification: rateallNotification } },
            options = { new: true };
        userDao.findOneAndUpdate(query, update, options).then((data) => {
            console.log("addrateallNotification -> data", data)

        }).catch((err) => {
            console.log("err", err)
        })
    })

}
function eventhappennotification() {
    const currentDate = new Date();
    event.find({ "starttime": currentDate }).then((eventlist) => {
        eventlist.map((eve) => {
            addeventhappenNotification(eve._id, eve.participants)
            userService.eventhappens(eve.participants)
        })
    }).catch((err) => {

    })
}
function addeventhappenNotification(eventId, participantIds) {
    participantIds.map((usr) => {
        let eventhappenNotification = {
            eventId: eventId,
        };
        let query = { _id: usr },
            update = { $push: { eventhappenNotification: eventhappenNotification } },
            options = { new: true };
        userDao.findOneAndUpdate(query, update, options).then((data) => {
            console.log("rateyou notification added -> data", data)

        }).catch((err) => {
            console.log("err", err)
        })
    })
}
Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
Date.prototype.addHours = function (h) {
    var date = new Date(this.valueOf());
    date.setTime(date.getTime() + (h * 60 * 60 * 1000));
    return date;
}
Date.prototype.removeMinutes = function (m) {
    var date = new Date(this.valueOf());
    date.setTime(date.getTime() - (m * 60 * 1000));
    return date;
}
function deleteevent(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token);
    let query = { _id: req.query.eventId, createdby: obj.id };
    eventdao.remove(query).then((eventdata) => {
        if (eventdata.deletedCount == 1) {
            res.json({ code: code.ok, message: msg.eventdel })
        } else if (eventdata.n == 0) {
            res.json({ code: code.badRequest, message: msg.evenotfound })
        } else {
            res.json({ code: code.badRequest, message: msg.cantdeleve })
        }

    }).catch((err) => {
        console.log("deleteevent -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function unjoinevent(req, res) {

    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { _id: req.query.eventId },
        update = { $pull: { participants: obj.id } },
        options = { new: true };
    // eventdao.findone(query).then((data) => {
    return eventdao.findOneAndUpdate(query, update, options).then((data) => {
        if (data) {
            console.log("unjoinevent -> data", data)
            let query1 = { _id: obj.id },
                update1 = { $pull: { participatedin: { eventId: data._id } } },
                options1 = { new: true };
            userDao.findOneAndUpdate(query1, update1, options1).then((userdata) => {
                // console.log("joinevent -> userdata", userdata)
                userService.joinevent(data.createdby, obj.id, data.id)//creatorsid,usersid,eventsid
                res.json({ code: code.ok, msg: msg.eventunjoin })
            })
        }
    }).catch((err) => {
        console.log("joinevent -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
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
    addeventunauthorized,
    twodaysbeforenotification,
    onedaysbeforenotification,
    oneminafternotification,
    eventhappennotification,
    deleteevent,
    unjoinevent,
    joinevent2,
    addjoineventNotification,
    addeventfullNotification,
    addeventhappenNotification,
    addeventafterhourNotification,
    addrateplayerNotification,
    addrateallNotification,
    latlongtokm
}