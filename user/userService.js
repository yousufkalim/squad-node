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
const env = require('dotenv').config();
const UAParser = require('ua-parser-js');
var FCM = require('fcm-node');
var serverKey = process.env.SERVER_KEY;
var fcm = new FCM(serverKey);
var ObjectId = require('mongodb').ObjectID;
function registerUser(req, res) {
    // const newpass = util.generateRandomPassword().toUpperCase()
    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    req.body.password = hash;
    const data = req.body

    return userdao.create(data).then(async (result) => {
        // let link = "http://" + req.headers.host + "/user/validateemail/" + result._id;

        // let data = {
        //     username: result.name,
        //     subject: "Validate Your EmailID for SQUAD",
        //     html: `Hi ${result.name} \n 
        //     Please click on ${link} to Validate Your EmailID. \n\n 
        //     If you did not request this, please ignore this email.\n`
        // }
        // await util.sendEMail(result.email, data).then((data) => {
        // return (data == true) ? res.json({ code: code.ok, message: `Link send on ${result.email}` })
        //     : res.json({ code: code.notImplemented, message: msg.mailNotSent })
        //     res.json({ code: code.created, message: msg.registered + " " + `Validation Link send on ${result.email}` })
        // })
        // if (data == true) {
        let tokn = util.generateToken(result, process.env.USER_SECRET);
        var dataresponse = {
            _id: result._id,
            name: result.name,
            email: result.email,
            contactNo: result.contactNo,
            token: tokn,
            role: result.role
        }

        // }
        res.json({ code: code.created, message: msg.registered, data: dataresponse })

    }).catch((err) => {
        console.log("createUser -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}


function loginUser(req, res) {
    console.log("loginUser ->   req.body.fcm", req.body.fcm)
    const fcmToken = req.body.fcm
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
                    //fcm push notification
                    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                        to: updateddata.fcmToken,//'registration_token',//fcm token
                        // collapse_key: 'your_collapse_key',

                        notification: {
                            title: 'Title of your push notification',
                            body: 'Body of your push notification'
                        },

                        data: {  //you can send only notification or only data(or include both)
                            my_key: 'CODERSOCOTH',
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
                    gender: (result.gender) ? result.gender : ""
                }
                return res.json({ code: code.ok, data: data })
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
                    subject: "Reset Password Link",
                    html: `Hi ${user.firstname} \n 
                    Please click on ${link} to reset your password. \n\n 
                    If you did not request this, please ignore this email and your password will remain unchanged.\n`
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
                if (browserName == "Firefox") {
                    res.redirect('squad://reset/' + user.resetPasswordToken)
                    res.render('reset.jade', { user });

                } else if (browserName == "Chrome") {
                    res.redirect('intent://reset/' + user.resetPasswordToken + '/#Intent;scheme=squad;package=com.squadxyz')

                    res.render('reset.jade', { user });
                } else {
                    res.redirect('squad://reset/' + user.resetPasswordToken)
                    res.render('reset.jade', { user });
                }

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
    // const { id, email, name } = req.body;
    const firstname = req.body.firstName.trim(),
        lastname = req.body.lastName.trim()
    socialId = req.body.id.trim(),
        email = req.body.email.trim(),
        fcmToken = req.body.fcm,
        location = req.body.location
    if (req.body.photo) {

        imageUrl = req.body.photo.trim()
    }
    else {
        imageUrl = ""
    }
    console.log("socialloginGmail -> req.body.name======================>", req.body)


    let query = { $or: [{ socialId: socialId }, { email: email }] },
        update = { $set: { email: email, firstname: firstname, lastname: lastname, isSocialLogin: true, imageUrl: imageUrl, fcmToken: fcmToken, location: location } },
        options = { new: true }
    return userdao.findOneAndUpdate(query, update, options).then(async (result) => {
        if (!result) {
            console.log("no result")
            req.body.isSocialLogin = true
            // req.body.accountType = accountType.CUSTOMER
            const data = {
                isSocialLogin: true,
                firstname: req.body.firstname.trim(),
                lastname: req.body.lastname.trim(),
                socialId: req.body.id.trim(),
                email: req.body.email.trim(),
                location: req.body.location
            }
            if (req.body.photo) {

                data.imageUrl = req.body.photo;
            }
            return userdao.create(data).then((user) => {
                console.log("socialloginGmail -> result", user)
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
        else {
            console.log(" result")
            let token = util.generateToken(result, process.env.USER_SECRET)
            let data = {
                _id: result._id,
                email: result.email,
                // accountType: result.accountType,
                firstname: result.firstname,
                lastname: result.lastname,
                imageUrl: result.imageUrl,
                token: token
            }
            return res.json({ code: code.ok, message: msg.loggedIn, data: data })
        }
    }).catch((err) => {
        console.log("socialloginGmail -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function socialloginFacebook(req, res) {
    // const { id, email, name } = req.body;
    const firstname = req.body.firstName.trim(),
        lastname = req.body.lastName.trim(),
        socialId = req.body.id.trim(),
        email = req.body.email.trim(),
        fcmToken = req.body.fcm,
        location = req.body.location
    if (req.body.imageUrl) {

        imageUrl = req.body.photo.trim()
    }
    else {
        imageUrl = ""
    }

    let query = { $or: [{ socialId: socialId }, { email: email }] },
        update = { $set: { email: email, firstname: firstname, lastname: lastname, isSocialLogin: true, imageUrl: imageUrl, fcmToken: fcmToken, location: location } },
        options = { new: true }
    return userdao.findOneAndUpdate(query, update, options).then(async (result) => {
        if (!result) {
            req.body.isSocialLogin = true
            // req.body.accountType = accountType.CUSTOMER
            const data = {
                isSocialLogin: true,
                firstname: req.body.firstname.trim(),
                lastname: req.body.lastname.trim(),
                socialId: req.body.id.trim(),
                email: req.body.email.trim(),
                location: req.body.location
            }
            if (req.body.photo) {

                data.imageUrl = req.body.photo;
            }
            return userdao.create(data).then((user) => {
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,

                    // accountType: user.accountType,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    token: token
                }
                console.log("socialloginFacebook -> data", data)
                return res.json({ code: code.ok, message: msg.loggedIn, data: data })
            })
        }
        else {
            let token = util.generateToken(result, process.env.USER_SECRET)
            let data = {
                _id: result._id,
                email: result.email,
                // accountType: result.accountType,
                firstname: result.firstname,
                lastname: result.lastname,
                imageUrl: result.imageUrl,
                token: token
            }
            console.log("socialloginFacebook -> data", data)
            return res.json({ code: code.ok, message: msg.loggedIn, data: data })
        }
    }).catch((err) => {
        console.log("socialloginFacebook -> catch", err)

        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function socialloginLinkedin(req, res) {
    console.log("socialloginLinkedin -> req=================================================", req.body)
    const firstname = req.body.firstName.trim(),
        lastname = req.body.lastName.trim(),
        socialId = req.body.socialId.trim(),
        email = req.body.email.trim(),
        fcmToken = req.body.fcm,
        location = req.body.location
    if (req.body.imageUrl) {

        imageUrl = req.body.imageUrl.trim()
    }
    else {
        imageUrl = ""
    }

    let query = { $or: [{ socialId: socialId }, { email: email }] },
        update = { $set: { email: email, firstname: firstname, lastname: lastname, isSocialLogin: true, imageUrl: imageUrl, fcmToken: fcmToken, location: location } },
        options = { new: true }
    return userdao.findOneAndUpdate(query, update, options).then(async (result) => {
        if (!result) {
            req.body.isSocialLogin = true
            // req.body.accountType = accountType.CUSTOMER
            const data = {
                isSocialLogin: true,
                firstname: req.body.firstName.trim(),
                lastname: req.body.lastname.trim(),
                socialId: req.body.socialId.trim(),
                email: req.body.email.trim(),
                location: req.body.location
            }
            if (req.body.imageUrl) {

                data.imageUrl = req.body.imageUrl;
            }
            return userdao.create(data).then((user) => {
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,
                    firstname: user.firstName,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    token: token
                }
                console.log("socialloginlinkedin -> data----------create", data)
                return res.json({ code: code.ok, message: msg.loggedIn, data: data })
            })
        }
        else {
            let token = util.generateToken(result, process.env.USER_SECRET)
            let data = {
                _id: result._id,
                email: result.email,
                firstname: result.firstName,
                lastname: result.lastname,
                imageUrl: result.imageUrl,
                token: token
            }
            console.log("socialloginlinkedin -> data------------login", data)
            return res.json({ code: code.ok, message: msg.loggedIn, data: data })
        }
    }).catch((err) => {
        console.log("socialloginlinkedin -> catch", err)

        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function getprofile(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)

    let query = { _id: obj.id }
    userdao.findone(query).then((data) => {
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
            gender: data.gender
        }
        res.json({ code: code.ok, data: response })
    }).catch((err) => {
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
            else res.render('validateemail.jade', { user });
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


    const { sportId, level, gender } = req.body;
    if (!req.query.radius) {
        req.query.radius = 100
    }
    let query = {
        $and: [{ preferences: { $elemMatch: { "sportId": sportId } } },
        { preferences: { $elemMatch: { "level": level } } },
        { gender: gender },
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
    user.find(query
    ).exec((err, data) => {
        if (err) {
            console.log("peoplearound -> err", err)
            return res.json({ code: code.internalError, message: msg.internalServerError })
        } else {
            return res.json({ code: code.ok, data: data })
        }
    })
}
function invitepeople(req, res) {
    let token = req.headers['authorization']
    const { users, eventId } = req.body;
    var obj = []
    users.map((el, i) => {
        let query = { _id: el }
        userdao.findone(query).then((data) => {
            let info = {
                firstname: data.firstname,
                email: data.email,
                fcmToken: (data.fcmToken) ? data.fcmToken : ''
            }
            obj.push(info)
            if (i == (users.length - 1)) {
                this.invitemail(obj, res, req.body.eventlink)

                // return obj
            }
        }).catch((err) => {
            console.log("invitepeople -> err", err)
        })
    })
}
async function invitemail(users, res, eventlink) {
    let usersemail = []
    users.map(async (el, i) => {
        usersemail.push(el.email)
        let link = eventlink;
        let data = {
            username: el.firstname,
            subject: "Invitation Link",
            html: `Hi ${el.firstname} \n 
           Someone invites you to the event click on these link and join ${link}`
        }
        await util.sendEMail(el.email, data).then((data) => {

            if ((data == true) && (i == (users.length - 1))) {
                return res.json({ code: code.ok, msg: `Invitation send to ${usersemail}` })
            }
        })
    })
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
    invitemail
}