const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const userdao = require('./userDao');
const sportdao = require('../sport/sportDao')
const bcrypt = require('bcrypt');
const user = require('../schema/user')
const crypto = require('crypto');
const { role } = require('../constants');
const { rateas } = require('../constants');
const env = require('dotenv').config();
const UAParser = require('ua-parser-js');
var FCM = require('fcm-node');
// const { response } = require('express');
// const { strict } = require('assert');

const userDao = require('./userDao');
const { promises } = require('fs');
var serverKey = process.env.SERVER_KEY;
var fcm = new FCM(serverKey);
var ObjectId = require('mongodb').ObjectID;





function registerUser(req, res) {
    // const newpass = util.generateRandomPassword().toUpperCase()
    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    req.body.password = hash;
    const data = req.body

    return userdao.create(data).then(async (result) => {
        let link = "http://" + req.headers.host + "/user/validateemail/" + result._id;

        let data = {
            username: result.name,
            subject: "Validate Your EmailID for SQUAD",
            html: `Hi ${result.name} \n 
            Please click on ${link} to Validate Your EmailID. \n\n 
            If you did not request this, please ignore this email.\n`
        }
        await util.sendEMail(result.email, data).then((data) => {

            (data == true) ? res.json({ code: code.ok, message: `Link send on ${result.email}` })
                : res.json({ code: code.notImplemented, message: msg.mailNotSent })
            res.json({ code: code.created, message: msg.registered + " " + `Validation Link send on ${result.email}` })
        })
        if (data == true) {
            let tokn = util.generateToken(result, process.env.USER_SECRET);
            var dataresponse = {
                _id: result._id,
                firstname: result.firstname,
                lastname: result.lastname,
                email: result.email,
                contactNo: result.contactNo,
                token: tokn,
                role: result.role
            }

        }
        res.json({ code: code.created, message: msg.registered, data: dataresponse })

    }).catch((err) => {
        console.log("createUser -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function loginUser(req, res) {
    console.log("loginUser ->   req.body.fcm", req.body.fcm)
    const fcmToken = (req.body.fcm) ? req.body.fcm : '';
    return user.findOne({ email: req.body.email }).then(async (result) => {
        if (result) {
            if (result.active == false) {
                return res.json({ code: code.forbidden, message: msg.deacacc })
            }
            const match = await bcrypt.compare(req.body.password, result.password);
            if (match) {
                //update fcm token
                let query = { _id: result._id },
                    update = { $set: { fcmToken: fcmToken } },
                    options = { new: true }
                user.findOneAndUpdate(query, update, options).then((updateddata) => {
                    console.log("loginUser -> updateddata", updateddata)
                })
                let tokn = util.generateToken(result, process.env.USER_SECRET)
                var data = {
                    _id: result._id,
                    name: result.name,
                    firstname: (result.firstName) ? result.firstname : "",
                    lastname: (result.lastname) ? result.lastname : "",
                    email: result.email,
                    contactNo: result.contactNo,
                    token: tokn,
                    role: result.role,
                    gender: (result.gender) ? result.gender : "",
                    imageUrl: (result.imageUrl) ? result.imageUrl : ""
                }
                if (result.emailvalidate == true) {
                    return res.json({ code: code.ok, data: data })
                } else if (result.emailvalidate == false) {
                    return res.json({ code: code.badRequest, message: msg.validatefirst })
                }
            } else {
                return res.json({ code: code.badRequest, message: msg.incorrectpass })
            }
        } else {
            return res.json({ code: code.notFound, message: msg.notFound })
        }
    }).catch((err) => {
        console.log("login -> err=================================================================>", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })

    })
}
function loginAdmin(req, res) {//user should be active
    return user.findOne({ email: req.body.email, role: role.admin }).then(async (result) => {
        if (result) {

            const match = await bcrypt.compare(req.body.password, result.password);
            if (match) {
                let tokn = util.generateToken(result, process.env.ADMIN_SECRET)


                return res.json({ code: code.ok, token: tokn })
            } else {
                return res.json({ code: code.badRequest, message: msg.incorrectpass })
            }
        } else {
            return res.json({ code: code.notFound, message: msg.notFound })
        }
    }).catch((err) => {
        console.log("login -> err=================================================================>", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })

    })
}
function forgotPassword(req, res) {
    let query = { email: req.body.email }
    userdao.findone(query).then((result) => {
        if (!result) return res.json({ code: code.notFound, message: msg.notFound });
        else {
            let token = crypto.randomBytes(20).toString('hex'),
                expiry = Date.now() + 3600000,
                query = { email: req.body.email },
                update = {
                    $set: {
                        resetPasswordToken: token,
                        resetPasswordExpires: expiry
                    }
                },
                options = { new: true }
            userdao.findOneAndUpdate(query, update, options).then(async (user) => {
                let link = "http://" + req.headers.host + "/user/reset/" + user.resetPasswordToken;

                let data = {
                    username: user.firstname,
                    subject: "Reset password instructions",
                    html: `Hello ${user.firstname}! <br>
                    Someone has requested to change your password.
                    You can do this through the link below. <br>
                   
                    ${link} <br>
                    If you didn't request this, please ignore this email. <br>
                    Your password won't change until you access the link above and create a new one.`

                }
                await util.sendEMail(user.email, data).then((data) => {
                    return (data == true) ? res.json({ code: code.ok, message: `Link send on ${result.email}` })
                        : res.json({ code: code.notImplemented, message: msg.mailNotSent })
                })
            })
        }
    }).catch((err) => {
        console.error({ err })

    })
}
function getresetpassword(req, res) {
    var parser = new UAParser();
    var ua = req.headers['user-agent'];
    var browserName = parser.setUA(ua).getBrowser().name;
    let query = { resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }
    userdao.findone(query)
        .then((user) => {
            if (!user) return res.json({ code: code.unAuthorized, message: msg.tokeninvalidorexpire })
            else {
                console.log("getresetpassword -> user.resetPasswordToken", user.resetPasswordToken)
                res.redirect('squad://reset/' + user.resetPasswordToken)
                // if (browserName == "Firefox") {
                //     res.redirect('squad://reset/' + user.resetPasswordToken)
                //     res.render('reset.jade', { user });

                // } else if (browserName == "Chrome") {
                //     res.redirect('intent://reset/' + user.resetPasswordToken + '/#Intent;scheme=squad;package=com.squadxyz')

                //     res.render('reset.jade', { user });
                // } else {
                //     res.redirect('squad://reset/' + user.resetPasswordToken)
                //     res.render('reset.jade', { user });
                // }
            }
        })
        .catch(err => {
            console.log("getresetpassword -> err", err)
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        });
}
function resetpassword(req, res) {
    let query = { resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }
    userdao.findone(query).then((result) => {
        if (!result) return res.json({ code: code.unAuthorized, message: msg.tokeninvalidorexpire })
        else {
            const { password } = req.body;
            let hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
                query = { resetPasswordToken: req.params.token },
                update = { $set: { password: hash, resetPasswordToken: "", resetPasswordExpires: "" } },
                options = { new: true }
            userdao.findOneAndUpdate(query, update, options).then(async (user) => {
                let data = {
                    username: user.firstname,
                    subject: "Your Password has been changed",
                    html: `Hi ${user.firstname} \n 
                    //                         This is a confirmation that the password for your account ${user.email} has just been changed.\n`
                }
                await util.sendEMail(user.email, data).then((data) => {
                    return (data == true) ? res.json({ code: code.ok, message: msg.passwordChanged })
                        : res.json({ code: code.notImplemented, message: msg.mailNotSent })
                })
            })
        }
    }).catch((err) => {
        console.error({ err })

    })
}
function socialloginGmail(req, res) {
    const socialId = req.body.id.trim(),
        email = req.body.email.trim();
    let query = { $or: [{ socialId: socialId }, { email: email }] };
    return userdao.findone(query).then((user) => {
        if (user) {
            let token = util.generateToken(user, process.env.USER_SECRET)
            let data = {
                _id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                imageUrl: user.imageUrl,
                token: token
            }
            return res.json({ code: code.ok, message: msg.loggedIn, data: data })
        } else {
            let addobj = {
                firstname: req.body.firstname.trim(),
                lastname: req.body.lastname.trim(),
                socialId: req.body.id.trim(),
                email: req.body.email.trim(),
                fcmToken: req.body.fcm,
                location: req.body.location,
                isSocialLogin: true
            }
            if (req.body.photo) {

                addobj.imageUrl = req.body.photo.trim()
            }
            else {
                addobj.imageUrl = ""
            }
            return userdao.create(addobj).then((user) => {
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    token: token
                }
                return res.json({ code: code.ok, message: msg.loggedIn, data: data })
            })
        }
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function socialloginFacebook(req, res) {
    const socialId = req.body.id.trim(),
        email = req.body.email.trim();
    let query = { $or: [{ socialId: socialId }, { email: email }] };
    return userdao.findone(query).then((user) => {
        if (user) {
            let token = util.generateToken(user, process.env.USER_SECRET)
            let data = {
                _id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                imageUrl: user.imageUrl,
                token: token
            }
            return res.json({ code: code.ok, message: msg.loggedIn, data: data })
        } else {
            let addobj = {
                firstname: req.body.firstname.trim(),
                lastname: req.body.lastname.trim(),
                socialId: req.body.id.trim(),
                email: req.body.email.trim(),
                fcmToken: req.body.fcm,
                location: req.body.location,
                isSocialLogin: true
            }
            if (req.body.photo) {

                addobj.imageUrl = req.body.photo.trim()
            }
            else {
                addobj.imageUrl = ""
            }
            return userdao.create(addobj).then((user) => {
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    token: token
                }
                return res.json({ code: code.ok, message: msg.loggedIn, data: data })
            })
        }
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })

}
function socialloginLinkedin(req, res) {
    const socialId = req.body.id.trim(),
        email = req.body.email.trim();
    let query = { $or: [{ socialId: socialId }, { email: email }] };
    return userdao.findone(query).then((user) => {
        if (user) {
            let token = util.generateToken(user, process.env.USER_SECRET)
            let data = {
                _id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                imageUrl: user.imageUrl,
                token: token
            }
            return res.json({ code: code.ok, message: msg.loggedIn, data: data })
        } else {
            let addobj = {
                firstname: req.body.firstname.trim(),
                lastname: req.body.lastname.trim(),
                socialId: req.body.id.trim(),
                email: req.body.email.trim(),
                fcmToken: req.body.fcm,
                location: req.body.location,
                isSocialLogin: true
            }
            if (req.body.photo) {

                addobj.imageUrl = req.body.photo.trim()
            }
            else {
                addobj.imageUrl = ""
            }
            return userdao.create(addobj).then((user) => {
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    token: token
                }
                return res.json({ code: code.ok, message: msg.loggedIn, data: data })
            })
        }
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })

}
function getprofile(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)

    let query = { _id: obj.id }
    userdao.findone(query).then(async (data) => {
        let avgrage = 0,
            rates = (data.rateasplayer) ? data.rateasplayer : [];

        Array.prototype.push.apply(rates, data.rateasorganizer);
        console.log("getprofile -> rates", rates)

        await rates.forEach(element => {
            avgrage += element.ratedwith;
        });
        console.log("getprofile -> avgrate", avgrage)
        let response = {
            firstname: data.firstname,
            lastname: data.lastname,
            active: data.active,
            dob: data.dob,
            _id: data._id,
            name: data.name,
            email: data.email,
            contactNo: data.contactNo,
            imageUrl: data.imageUrl,
            role: data.role,
            gender: data.gender,

            rating: (avgrage / rates.length).toFixed(1),
            //default
            events: 0,
            Calendercount: 0
        }
        res.json({ code: code.ok, data: response })
    }).catch((err) => {
        console.log("getprofile -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function update(req, res) {
    let query = { _id: req.query.userId },
        update = { $set: req.body },
        options = { new: true }
    userdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        console.log("update -> err", err)
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function sportlist(req, res) {
    let query = { status: status.active }
    sportdao.find(query).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function verifyToken(req, res, next) {
    var token = req.headers['authorization'];


    if (!token) {
        // return res.json({ msg: "Token not provided" })
        return res.json({ code: code.badRequest, message: msg.tokenNotPrvided, data: {} })
    } else {
        util.verifyAdminToken(token).then((result) => {
            if (result) {
                return res.json({ code: code.ok, message: "Token valid" })

            } else {

                return res.json({ code: code.internalError, message: msg.internalServerError, err: err })
            }
        }).catch(err => {

            return res.json({ code: code.unAuthorized, message: msg.inValidToken })
        })
    }
}
// function updateProfile(req, res) {
//     let token = req.headers['authorization']
//     let obj = util.decodeToken(token)
//     let query = { _id: obj.id },
//         // let query = { _id: req.query.id },
//         update = { $set: req.body },
//         options = { new: true }
//     return commondao.findOneAndUpdate(query, update, options).then((result) => {
//         if (!result) {
//             res.json({ code: code.notFound, message: msg.notFound })
//         }
//         else {
//             res.json({ code: code.ok, message: msg.recordUpdated })
//         }
//     }).catch((err) => {
//         res.json({ code: code.ineternalError, message: msg.internalServerError })
//     })
// }
function createpreference(req, res, next) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { _id: obj.id },
        update = { $push: { "preferences": req.body.preferences } },
        options = { new: true };
    userdao.findOneAndUpdate(query, update, options).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        console.log("createpreference -> err", err)

        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function getpreference(req, res, next) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { _id: obj.id }
    let finalpreferancearray = []
    user.findOne(query).populate('preferences.sportId', '_id name image').then((data) => {
        data.preferences.map((preferance) => {
            if (preferance.sportId != null) {
                let obj = {
                    ...preferance._doc,
                    isSelected: true
                }
                finalpreferancearray.push(obj);
            }

        })
        sportdao.find({ status: status.active }).then((sportlist) => {
            sportlist.map((list => {
                var found = finalpreferancearray.filter(item => {
                    let match;
                    if (item.sportId) {
                        match = (item.sportId.name === list.name)
                        return match
                    } else {
                        match = (item.name === list.name);
                        return match
                    }
                })

                if (found == false) {
                    let obj = {
                        ...list._doc,
                        isSelected: false
                    }
                    finalpreferancearray.push(obj)
                }
            }))
            res.json({ code: code.ok, data: finalpreferancearray })

        })
    }).catch((err) => {
        console.log("getpreference -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function updatepreference(req, res) {
    user.updateOne({ preferences: { $elemMatch: { _id: req.query.preferanceId } } },
        { $set: { 'preferences.$': req.body } }).exec((err, data) => {
            if (err) {
                return res.json({ code: code.internalError, message: msg.internalServerError })
            } else {
                return res.json({ code: code.ok, message: msg.preferencesupdated })
            }
        })
}
function getvalidateemail(req, res) {
    let query = { _id: req.params.id };
    userdao.findone(query)
        .then((user) => {
            if (!user) return res.json({ code: code.unAuthorized, message: msg.notFound })
            else {
                res.redirect('squad://authenticate/' + user._id)
                res.render('validateemail.jade', { user });
            }
        })
        .catch(err => {
            console.log("getresetpassword -> err", err)
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        });
}
function validateemail(req, res) {
    let query = { _id: req.params.id },
        update = { emailvalidate: true };
    userdao.findOneAndUpdate(query, update)
        .then((user) => {
            if (!user) return res.json({ code: code.notFound, message: msg.notFound })
            else res.json({ code: code.ok, message: msg.emailvalidate });
        })
        .catch(err => {

            res.json({ code: code.ineternalError, message: msg.internalServerError })
        });
}
async function removepreference(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    console.log("removepreference -> obj", obj)
    let query = { _id: obj.id },
        update = { "$pull": { preferences: { "_id": ObjectId(req.query.preferenceId) } } },
        options = { safe: true, multi: true }
    user.findOneAndUpdate(query, update, options).exec((err, data) => {
        if (err) {
            return res.json({ code: code.internalError, message: msg.internalServerError })
        } else {
            return res.json({ code: code.ok, message: msg.preferancedeleted })
        }
    })
}
async function peoplearound(req, res) {// db.users.createIndex( {location: "2dsphere" } )
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    const { eventId, level, gender } = req.body;
    if (!req.query.radius) {
        req.query.radius = 100
    }
    let query = {
        $and: [
            { participatedin: { $elemMatch: { "eventId": { $nin: eventId } } } },
            { preferences: { $elemMatch: { "level": { $in: level } } } },
            { gender: { $in: gender } },

            {
                location: {
                    $nearSphere: {
                        $geometry: { type: "Point", coordinates: [req.query.long, req.query.lat] },
                        $maxDistance: parseFloat(req.query.radius) * 1000
                    }
                }
            }
        ],
    }
    console.log("peoplearound -> query", query.participatedin, query.preferences, query.gender, query.location)
    user.find(query, '_id firstname lastname imageUrl').exec((err, data) => {//have to add friend flag here
        if (err) {
            console.log("peoplearound -> err", err)

            return res.json({ code: code.internalError, message: msg.internalServerError })
        } else {
            let finallist = []

            if (data.length == 0) {
                return res.json({ code: code.ok, data: data, count: 0 })
            }
            data.map((userdata, index) => {
                var fr = (userdata.friends) ? userdata.friends.includes(obj.id) : false;
                userdata = {
                    ...userdata._doc,
                    friend: fr
                }
                finallist.push(userdata)
                if (data.length == (index + 1)) {
                    return res.json({ code: code.ok, data: finallist, count: finallist.length })
                }
            })
        }
    })
}
function invitepeople(req, res) {
    let token = req.headers['authorization'];
    let userId = util.decodeToken(token)
    const { users, eventId } = req.body;
    console.log("invitepeople ->  users, eventId", users, eventId)
    var obj = []
    users.map((el, i) => {
        let query = { _id: el }
        userdao.findone(query).then((data) => {
            let info = {
                firstname: data.firstname,
                email: data.email,
                fcmToken: (data.fcmToken) ? data.fcmToken : '',
                userid: data._id
            }
            obj.push(info)
            console.log("invitepeople -> i == (users.length - 1)", i, users.length, i == (users.length - 1))
            if (i == (users.length - 1)) {
                console.log("invitepeople -> req.body.manualInvite.length", req.body.manualInvite.length)
                if (req.body.manualInvite.length != 0) {
                    var manualinv = req.body.manualInvite
                    manualinv.map(async (el, index) => {
                        el.fcmToken = (el.fcmToken) ? el.fcmToken : '';
                        obj.push(el);
                        if (index == (manualinv.length - 1)) {
                            //add to invitation to user record
                            addgameinvitation(obj, userId.id, eventId)
                            invitemail(res, req, obj, eventId);
                        }
                    })
                } else {
                    console.log("invitepeople -> else")
                    addgameinvitation(obj, userId.id, eventId)
                    invitemail(res, req, obj, eventId);
                }


            }
        }).catch((err) => {
            console.log("invitepeople -> err", err)
        })
    })
}
async function addgameinvitation(userlist, sederId, eventId) {
    console.log("addgameinvitation func 1 -> userlist", userlist, sederId, eventId)
    userlist.map((el) => {
        let invitation = {
            senderId: sederId,
            eventId: eventId
        };
        if (el.userid) {
            let query = { _id: el.userid },
                update = { $push: { invitationtogame: invitation } },
                options = { new: true };
            user.findOneAndUpdate(query, update, options).then((data) => {
                console.log("addgameinvitation -> data", data)

            }).catch((err) => {
                console.log("addgameinvitation -> err", err)

            })
        }
    })
}
async function gamenotification(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    let query = { _id: obj.id };
    await user.findOne(query)
        .populate('invitationtogame.senderId', '_id firstname lastname imageUrl')
        .populate('invitationtogame.eventId', '_id date starttime endtime Address')
        .populate('rateyouNotification.userId', '_id firstname lastname imageUrl')
        .populate('joineventNotification.userId', '_id firstname lastname imageUrl')
        .populate('joineventNotification.eventId', '_id date starttime endtime Address')
        // .populate('friendrequestNotification.userId', '_id firstname lastname imageUrl')
        .populate('eventhappenNotification.eventId', '_id date starttime endtime Address')
        .populate('eventafterhourNotification.eventId', '_id date starttime endtime Address')
        .populate('rateplayerNotification.eventId', '_id date starttime endtime Address')
        .populate('rateallNotification.eventId', '_id date starttime endtime Address')
        .then((data) => {
            res.json({
                code: code.ok, gameinvitationnotification: [{ "ratenotification": data.rateyouNotification },
                { joineventnotification: data.joineventNotification },
                { eventhappenNotification: data.eventhappenNotification },
                { eventafterhourNotification: data.eventafterhourNotification },
                { rateplayerNotification: data.rateplayerNotification },
                { rateallNotification: data.rateallNotification }]
            })
        }).catch((err) => {
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })
}
async function friendnotification(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    let query = { _id: obj.id };
    await user.findOne(query)

        .populate('friendrequestNotification.userId', '_id firstname lastname imageUrl')

        .then((data) => {
            res.json({
                code: code.ok, friendnotification: data.friendrequestNotification,

            })
        }).catch((err) => {
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })
}
async function gamenotifdecline(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    let query = { _id: obj.id },
        update = { "$pull": { invitationtogame: { "_id": ObjectId(req.query.requestId) } } },
        options = { new: true };
    userDao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, message: msg.invitatdec })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
async function invitemail(res, req, users, eventId) {
    console.log("invitemail function 2-> users", users, eventId)
    let usersemail = [];
    users.map(async (el, i) => {
        console.log("invitemail -> el", el.email)
        let userId = (el.userid) ? el.userid : ''
        let link = "http://" + req.headers.host + "/user/getinvite/" + eventId + '/' + userId;
        usersemail.push(el.email)
        let data = {
            username: el.firstname,
            subject: "Invitation Link",
            html: `Hi ${el.firstname} \n 
           Someone invites you to the event click on these link and join ${link}`
        }
        await util.sendEMail(el.email, data).then((data) => {
            let fcm_token = (users.fcmToken) ? users.fcmToken : '';
            invitenotification(fcm_token)
            if ((data == true) && (i == (users.length - 1))) {
                return res.json({ code: code.ok, msg: `Invitation send to ${usersemail}` })
            }
        }).catch((err) => {
            console.log("invitemail -> err", err)

        })
    })
}
async function getinvite(req, res) {
    console.log("getinvite -> req.headers.eventId", req.params.eventId, req.params.userId)
    res.redirect("squad://joinevent/eventId=" + req.params.eventId)
    // res.redirect('squad://join/' + req.params.userId + '/' + req.params.eventId)//deeplinking url for join event
}
async function peoplecount(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    let myPromise = new Promise(function (myResolve, myReject) {
        let query = { _id: obj.id };
        let userIds = []
        user.findOne(query).populate('participatedin.eventId', '_id participants').then((userdata) => {
            userdata.participatedin.map((el, index) => {
                // console.log("peoplecount -> el", el.eventId)
                if (el.eventId && el.eventId.participants) {
                    el.eventId.participants.map((userid) => {
                        if (userid != obj.id) {
                            userIds.push(userid)
                        }
                    })
                }

            })
            let unique = userIds.filter((it, i, ar) => ar.indexOf(it) === i);
            user.find({ _id: { $in: unique } }).then((users) => {
                myResolve(users.length)
            })
        }).catch((err) => {
            myReject(err)
        })
    })
    let peoplearound = new Promise(function (myResolve, myReject) {
        user.findOne({ _id: obj.id }).then(async (userdat) => {
            let query = {
                location: {
                    $nearSphere: {
                        $geometry: { type: "Point", coordinates: [userdat.location.coordinates[0], userdat.location.coordinates[1]] },
                        $maxDistance: parseFloat(100) * 1000
                    }
                }
            }
            await user.find(query).then((data) => {
                myResolve(data.length)
            }).catch((err) => {
                myReject(err)
            })
        })
    })
    let newtosquad = new Promise(function (myResolve, myReject) {
        let query = {
            participatedin: { $exists: true, $size: 0 }
        };
        userdao.find(query).then((userdata) => {
            myResolve(userdata.length)
        }).catch((err) => {
            myReject(err)
        })
    })
    let friends = new Promise(function (myResolve, myReject) {
        user.findOne({ _id: obj.id }).then((data) => {
            myResolve(data.friends.length)
        }).catch((err) => {
            myReject(err)
        })
    })
    Promise.all([myPromise, peoplearound, newtosquad, friends]).then((values) => {
        print(values);
    });
    function print(data) {
        console.log("print -> data", data)
        let obj = {
            //peopleimet,peoplearound,new,friends
            peopleImet: data[0],
            peopleAround: data[1],
            newToSquad: data[2],
            myFriends: data[3],
        }
        return res.json({ code: code.ok, data: obj })
    }

}
function addRatingasplayer(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)
    const { ratearray } = req.body;
    ratearray.map((ele, index) => {
        console.log("addRatingasplayer -> ele", ratearray.length, index + 1)
        let rating = {
            by: obj.id,
            ratedwith: ele.rate
        }
        let query = { _id: ele.userId },
            update = { $push: { "rateasplayer": rating } },
            options = { new: true };
        userdao.findOneAndUpdate(query, update, options).then((userdata) => {
            addratingnotif(rateas.player, obj.id, ele.userId)
                (userdata.fcmToken) ? rateyounotification(userdata.fcmToken) : '';
        }).catch((err) => {
            console.log("addRating -> err==================================", err)
        })
        if (ratearray.length == index + 1) {
            return res.json({ code: code.ok, msg: msg.addrate })
        }
    })
}
function addRatingasorganizer(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)
    const { rate, userId } = req.body;
    let rating = {
        by: obj.id,
        ratedwith: rate
    }
    let query = { _id: userId },
        update = { $push: { "rateasorganizer": rating } },
        options = { new: true };
    userdao.findOneAndUpdate(query, update, options).then((userdata) => {
        addratingnotif(rateas.organizer, obj.id, userId);
        (userdata.fcmToken) ? rateyounotification(userdata.fcmToken) : '';
        return res.json({ code: code.ok, msg: msg.addrate })
    }).catch((err) => {
        console.log("addRating -> err===============================", err)
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}

function addratingnotif(type, senderId, receiverId) {

    let rateyouNotification = {
        type: type,
        userId: senderId
    };

    let query = { _id: receiverId },
        update = { $push: { rateyouNotification: rateyouNotification } },
        options = { new: true };
    user.findOneAndUpdate(query, update, options).then((data) => {
        console.log("rateyou notification added -> data", data)

    }).catch((err) => {
        console.log("err", err)

    })


}
function peoplenewtosquad(req, res) {
    let query = {
        participatedin: { $exists: true, $size: 0 }
    };
    userdao.find(query).then((userdata) => {
        return res.json({ code: code.ok, data: userdata, count: userdata.length })
    }).catch((err) => {
        console.log("peoplenewtosquad -> err", err)
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
function peopleimet(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    let query = { _id: obj.id };
    let userIds = []
    user.findOne(query).populate('participatedin.eventId', '_id participants').then((userdata) => {
        userdata.participatedin.map((el, index) => {
            if (el.eventId && el.eventId.participants) {

                el.eventId.participants.map((userid) => {
                    if (userid != obj.id) {
                        userIds.push(userid)
                    }
                })
            }

        })
        let unique = userIds.filter((it, i, ar) => ar.indexOf(it) === i);
        user.find({ _id: { $in: unique } }, '_id firstname lastname imageUrl email').then((users) => {
            return res.json({ code: code.ok, data: users, count: users.length })
        })
    }).catch((err) => {
        console.log("peopleimet -> err", err)
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
function listforfriendrequest(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    let excludeIds = [];
    userdao.findone({ _id: obj.id }).then((data) => {
        excludeIds.push(ObjectId(obj.id))
        data.friends.map(id => excludeIds.push(ObjectId(id)))
        data.sentRequest.map(id => excludeIds.push(ObjectId(id)))
        data.friendRequest.map(id => excludeIds.push(ObjectId(id)))
        user.find({ _id: { $nin: excludeIds }, 'role': role.user }, '_id firstname lastname imageUrl').then((userdata) => {
            return res.json({ code: code.ok, data: userdata })
        })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
function listorsentrequest(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    user.findOne({ _id: obj.id }).populate('sentRequest', '_id firstname lastname imageUrl').then((data) => {
        return res.json({ code: code.ok, data: data.sentRequest })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}
function sendrequest(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)//will push userId to sentrequest 
    const { userId } = req.body;//whome you want to send request push obj.id to friend request
    let query = { _id: userId },
        update = { $push: { friendRequest: obj.id } },
        options = { new: true };
    userdao.findOneAndUpdate(query, update, options).then((receiverdata) => {
        friendrequestnotif(receiverdata);
        let query1 = { _id: obj.id },
            update1 = { $push: { sentRequest: userId } },
            options1 = { new: true };
        userdao.findOneAndUpdate(query1, update1, options1).then((senderdata) => {
            friendrequestNotification(obj.id, userId)
            return res.json({ code: code.ok, msg: "request sent" })
        })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}

function friendrequestNotification(senderId, receiverId) {
    let friendrequestNotification = {
        userId: senderId
    };

    let query = { _id: receiverId },
        update = { $push: { friendrequestNotification: friendrequestNotification } },
        options = { new: true };
    user.findOneAndUpdate(query, update, options).then((data) => {
        console.log("friendrequestNotification -> data", data)
    }).catch((err) => {
        console.log("err", err)

    })
}
function requestlist(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    user.findOne({ _id: obj.id }).populate('friendRequest', '_id firstname lastname imageUrl').then((data) => {
        return res.json({ code: code.ok, data: data.friendRequest })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
function friendlist(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    user.findOne({ _id: obj.id }).populate('friends', '_id firstname lastname imageUrl').then((data) => {
        return res.json({ code: code.ok, data: data.friends, count: data.friends.length })
    }).catch((err) => {
        console.log("friendlist -> err", err)
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
function acceptrequest(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);//removefrom friendreques add to friend
    const { userId } = req.body;//whome request user ant to accept remove from sent and add to friend
    let query = { _id: obj.id },
        update = { $push: { friends: userId }, $pull: { friendRequest: userId } },
        options = { new: true };
    userdao.findOneAndUpdate(query, update, options).then((acceptby) => {
        let query1 = { _id: userId },
            update1 = { $push: { friends: obj.id }, $pull: { sentRequest: obj.id } },
            options1 = { new: true };
        userdao.findOneAndUpdate(query1, update1, options1).then((acceptof) => {
            return res.json({ code: code.ok, msg: "request accepted" })
        })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}
function declinerequest(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);//removefrom friendreques 
    const { userId } = req.body;//whome request user ant to decline remove from sent
    let query = { _id: obj.id },
        update = { $pull: { friendRequest: userId } },
        options = { new: true };
    userdao.findOneAndUpdate(query, update, options).then((acceptby) => {
        let query1 = { _id: userId },
            update1 = { $pull: { sentRequest: obj.id } },
            options1 = { new: true };
        userdao.findOneAndUpdate(query1, update1, options1).then((acceptof) => {
            return res.json({ code: code.ok, msg: "request declined" })
        })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}



function canclerequest(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);//sentRequest
    const { userId } = req.body;//friendRequest
    let query = { _id: obj.id },
        update = { $pull: { sentRequest: userId } },
        options = { new: true };
    userDao.findOneAndUpdate(query, update, options).then((data) => {
        console.log("canclerequest -> data", data.sentRequest)
        let query1 = { _id: userId },
            update1 = { $pull: { friendRequest: obj.id } },
            options1 = { new: true };
        userDao.findOneAndUpdate(query1, update1, options1).then((usserdata) => {
            console.log("canclerequest -> usserdata", usserdata.friendRequest)
            return res.json({ code: code.ok, message: "Request cancle" })
        })

    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}

function unfriend(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);//sentRequest
    const { userId } = req.body;//friendRequest
    let query = { _id: obj.id },
        update = { $pull: { friends: userId } },
        options = { new: true };
    userDao.findOneAndUpdate(query, update, options).then((data) => {
        console.log("canclerequest -> data", data.sentRequest)
        let query1 = { _id: userId },
            update1 = { $pull: { friends: obj.id } },
            options1 = { new: true };
        userDao.findOneAndUpdate(query1, update1, options1).then((usserdata) => {
            console.log("canclerequest -> usserdata", usserdata.friendRequest)
            return res.json({ code: code.ok, message: "unfriend" })
        })

    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}

function userdetail(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);//sentRequest
    let query = { _id: obj.id };
    var rateasplayer = 0,
        rateasorganizer = 0,
        friendstatus = null;
    userdao.findone(query).then((data) => {
        if (data.rateasplayer) {
            data.rateasplayer.map((player) => {
                rateasplayer += player.ratedwith
            })
        }
        if (data.rateasorganizer) {
            data.rateasorganizer.map((organizer) => {
                rateasorganizer += organizer.ratedwith
            })
        }
        if (data.friends.includes(req.query.userId)) {
            friendstatus = "Remove friend"
        } else if (data.friendRequest.includes(req.query.userId)) {
            friendstatus = "Accept or Reject"
        } else if (data.sentRequest.includes(req.query.userId)) {
            friendstatus = "Requested"
        } else {
            friendstatus = "Add friend"
        }

        let Obj = {
            "imageUrl": (data.imageUrl) ? data.imageUrl : '',
            "totalfriends": (data.friends) ? data.friends.length : 0,
            "firstname": (data.firstname) ? data.firstname : "",
            "lastname": (data.lastname) ? data.lastname : "",
            "dob": (data.dob) ? data.dob : "",
            "email": (data.email) ? data.email : "",
            "gender": (data.gender) ? data.gender : "",
            "contactNo": (data.contactNo) ? data.contactNo : "",
            "Noofeventplayed": (data.participatedin) ? data.participatedin.length : 0,
            "rateasorganizer": (data.rateasorganizer) ? rateasorganizer / data.rateasorganizer.length : "",
            "rateasplayer": (data.rateasplayer) ? rateasplayer / data.rateasplayer.length : "",
            "friendshipstatus": friendstatus

        }
        res.json({ code: code.ok, data: Obj })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function getuserpreference(req, res, next) {
    let query = { _id: req.query.userId }
    let finalpreferancearray = []
    user.findOne(query).populate('preferences.sportId', '_id name image').then((data) => {
        data.preferences.map((preferance) => {
            if (preferance.sportId != null) {
                let obj = {
                    ...preferance._doc,
                    isSelected: true
                }
                finalpreferancearray.push(obj);
            }

        })
        sportdao.find({ status: status.active }).then((sportlist) => {
            sportlist.map((list => {
                var found = finalpreferancearray.filter(item => {
                    let match;
                    if (item.sportId) {
                        match = (item.sportId.name === list.name)
                        return match
                    } else {
                        match = (item.name === list.name);
                        return match
                    }
                })

                if (found == false) {
                    let obj = {
                        ...list._doc,
                        isSelected: false
                    }
                    finalpreferancearray.push(obj)
                }
            }))
            res.json({ code: code.ok, data: finalpreferancearray })

        })
    }).catch((err) => {
        console.log("getpreference -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

function invitenotification(users) {//sent to user
    console.log("invitenotification -> users", users)
    var message = {
        to: (users.fcmToken) ? users.fcmToken : '',//fcm token whom you want to notify
        notification: {
            title: 'Someone invites you in a game',
            // body: 'Body of your push notification'
        },
        data: {
            my_key: 'CODERSCOTCH',
            my_another_key: 'my another value'
        }
    };
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}
function rateyounotification(fcmToken) {
    var message = {
        to: fcmToken,//fcm token of event creator
        // collapse_key: 'your_collapse_key',

        notification: {
            title: 'Someone rate you',
            // body: 'Body of your push notification'
        },

        data: {
            my_key: 'CODERSCOTCH',
            my_another_key: 'my another value'
        }
    };
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("loginUser -> err============================================>", err)
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}
function eventfullnotification(creatorId, eventId) {//sent to event creator
    //creatorId,eventId
    userdao.findone({ _id: creatorId }).then((userdata) => {
        if (userdata.fcmToken) {
            var message = {
                to: userdata.fcmToken,//fcm token of event creator
                notification: {
                    title: 'one of your events is full',

                },
                data: {
                    my_key: 'CODERSCOTCH',
                    my_another_key: 'my another value'
                }
            };
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log("loginUser -> err============================================>", err)
                    console.log("Something has gone wrong!");
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
        }

    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}
function eventhournotification(adminId, hours) {//sent to event owner
    user.findById({ _id: adminId }).then((data) => {
        let fcmtoken = (data.fcmToken) ? data.fcmToken : ""
        console.log("eventhournotification -> data", fcmtoken)
        var message = {
            to: fcmtoken,
            notification: {
                title: `Event is in ${hours} hourse make your event public`,
            },
            data: {
                my_key: 'CODERSCOTCH',
                my_another_key: 'my another value'
            }
        };
        fcm.send(message, function (err, response) {
            if (err) {
                console.log("loginUser -> err============================================>", err)
                console.log("Something has gone wrong!");
            } else {
                console.log("Successfully sent with response: ", response);
            }
        });
    }).catch((err) => {

    })

}
function joinevent(creatorsid, usersid, eventsid) {
    userdao.findone({ _id: creatorsid }).then((creatordata) => {
        if (creatordata.fcmToken) {
            userdao.findone({ _id: usersid }).then((userdata) => {
                if (userdata) {
                    var username = (userdata.firstname) ? userdata.firstname : "Someone";
                    var message = {
                        to: creatordata.fcmToken,
                        notification: {

                            title: `${username} join your event`,
                        },
                        data: {
                            my_key: 'CODERSCOTCH',
                            my_another_key: 'my another value'
                        }
                    };
                    fcm.send(message, function (err, response) {
                        if (err) {
                            console.log("loginUser -> err============================================>", err)
                            console.log("Something has gone wrong!");
                        } else {
                            console.log("Successfully sent with response: ", response);
                        }
                    });
                }
            })
        }

    }).catch((err) => {

    })
}
function ratenotification(participantIds) {
    participantIds.map((usr) => {
        user.findById({ _id: usr }).then((dta) => {
            var message = {
                to: (dta.fcmToken) ? dta.fcmToken : '',
                notification: {
                    title: 'Rate Vanue/Organizer/Players',
                },
                data: {
                    my_key: 'CODERSCOTCH',
                    my_another_key: 'my another value'
                }
            };
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log("ratenotification -> err", err)
                    console.log("Something has gone wrong!");
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
        }).catch((err) => {

        })
    })
}
function rateplayernotification(creatorId, eventId) {//sent to event creator
    //creatorId,eventId
    userdao.findone({ _id: creatorId }).then((userdata) => {
        if (userdata.fcmToken) {
            var message = {
                to: userdata.fcmToken,//fcm token of event creator
                notification: {
                    title: 'Rate Player of your event',

                },
                data: {
                    my_key: 'CODERSCOTCH',
                    my_another_key: 'my another value'
                }
            };
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log("loginUser -> err============================================>", err)
                    console.log("Something has gone wrong!");
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
        }

    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}
function eventhappens(participantIds) {//sent to all participants
    // participantIds
    participantIds.map((usr) => {
        user.findById({ _id: usr }).then((dta) => {
            var message = {
                to: (dta.fcmToken) ? dta.fcmToken : '',
                notification: {
                    title: 'One of your events started',
                },
                data: {
                    my_key: 'CODERSCOTCH',
                    my_another_key: 'my another value'
                }
            };
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log("loginUser -> err============================================>", err)
                    console.log("Something has gone wrong!");
                } else {
                    console.log("Successfully sent with response: ", response);
                }
            });
        }).catch((err) => {

        })
    })

}
function friendrequestnotif(users) {//sent to user
    console.log("invitenotification -> users", users)
    var message = {
        to: (users.fcmToken) ? users.fcmToken : '',//fcm token whom you want to notify
        notification: {
            title: 'Someone wants to be your friend',
            // body: 'Body of your push notification'
        },
        data: {
            my_key: 'CODERSCOTCH',
            my_another_key: 'my another value'
        }
    };
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Something has gone wrong!");
        } else {
            console.log("Successfully sent with response: ", response);
        }
    });
}
module.exports = {
    registerUser,
    // updateProfile,
    loginUser,
    forgotPassword,
    getresetpassword,
    resetpassword,
    getprofile,
    socialloginGmail,
    socialloginFacebook,
    socialloginLinkedin,
    update,
    sportlist,
    verifyToken,
    loginAdmin,
    createpreference,
    getpreference,
    updatepreference,
    getvalidateemail,
    validateemail,
    removepreference,
    peoplearound,
    invitepeople,
    invitemail,
    peoplecount,
    invitenotification,
    rateyounotification,
    addRatingasplayer,
    addRatingasorganizer,
    joinevent,
    eventfullnotification,
    getinvite,
    eventhournotification,
    ratenotification,
    eventhappens,
    peoplenewtosquad,
    peopleimet,
    rateplayernotification,
    listforfriendrequest,
    sendrequest,
    friendrequestnotif,
    requestlist,
    friendlist,
    acceptrequest,
    declinerequest,
    addgameinvitation,
    gamenotification,
    gamenotifdecline,
    listorsentrequest,
    canclerequest,
    unfriend,
    userdetail,
    getuserpreference,
    addratingnotif,
    friendrequestNotification,
    friendnotification
}