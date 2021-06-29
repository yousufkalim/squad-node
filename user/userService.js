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
const fs = require('fs');
const https = require('https');
const geolib = require('geolib');
const event = require('../schema/event')
const dateFormat = require('dateformat');
// const { response } = require('express');
// const { strict } = require('assert');
const userDao = require('./userDao');
const { promises } = require('fs');
// const { resolve } = require('path');
var serverKey = process.env.SERVER_KEY;
var fcm = new FCM(serverKey);
var ObjectId = require('mongodb').ObjectID;
var admin = require("firebase-admin")
var serviceAccount = require("../firebase_sdk/squad-xyz-61441-firebase-adminsdk-4zmx5-0330ac1321.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://squad-xyz-61441-default-rtdb.europe-west1.firebasedatabase.app"
  })
    


function getFcm(req, res) {

    let query = { _id: req.query.id }
    return userdao.findone(query).then((result) => {
        if(result){
            return res.json({ code: code.ok, data: result.fcmToken })
        } else {
            return res.json({ code:404, message: 'data not found' })
        }
    }).catch((err) => {
        console.log("fcm -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

function DefaultPreference(id){
    return sportdao.find().then((data) => {
        var deff = []
        for(let i = 0; i < data.length; i++){
            var defaultPref = {
                sportId: data[i]._id,
                radius: 6000,
                level: 'ALL'
            }
            deff.push(defaultPref)
        }

        let query = { _id: id },
        update = { $push: { "preferences": deff } },
        options = { new: true };
        userdao.findOneAndUpdate(query, update, options)
    })
}

async function registerUser(req, res) {
    // console.log('here arrive')
    // const newpass = util.generateRandomPassword().toUpperCase()
    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    req.body.password = hash;
    req.body.gender = 'MEN';
    const data = req.body

    return userdao.create(data).then(async (result) => {
        let link = "http://" + req.headers.host + "/user/validateemail/" + result._id;

        const defultvar = DefaultPreference(result._id)

        let data = {
            username: result.name,
            subject: "Squad XYZ: Validate Your EmailID for SQUAD",
            html: `Hi ${result.name} <br /> 
            Please click on here:<a href="${link}"> Squad XYZ</a> to Validate Your EmailID. <br /><br /> 
            If you did not request this, please ignore this email.<br /> <br />Best Regards,<br />Squad XYZ Team`
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
                    // console.log("loginUser -> updateddata", updateddata)
                })
                let tokn = util.generateToken(result, process.env.USER_SECRET)
                var data = {
                    _id: result._id,
                    name: result.name,
                    firstname: (result.firstname) ? result.firstname : "",
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
                    subject: "Squad XYZ: Reset password instructions",
                    html: `Hello ${user.firstname}! <br>
                    Someone has requested to change your password.
                    You can do this through the link below. <br>
                   
                    here: <a href="${link}">Squad XYZ</a> <br>
                    If you didn't request this, please ignore this email. <br>
                    Your password won't change until you access the link above and create a new one. <br /><br />Best Regards,<br />Squad XYZ Team`

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
            if (!user) return res.send('<style>*{transition:all .6s}html{height:100%}body{font-family:Lato,sans-serif;color:#888;margin:0}#main{display:table;width:100%;height:100vh;text-align:center}.fof{display:table-cell;vertical-align:middle}.fof h1{font-size:50px;display:inline-block;padding-right:12px;animation:type .5s alternate infinite}@keyframes type{from{box-shadow:inset -3px 0 0 #888}to{box-shadow:inset -3px 0 0 transparent}}</style><div id="main"><div class="fof"><h1>Your Requested Link is Expired</h1></div></div>')
            else {
                console.log("getresetpassword -> user.resetPasswordToken", ua, user.resetPasswordToken)
               res.redirect('squad://reset/' + user.resetPasswordToken)
                res.render('reset.jade')
                //==================
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
                //=======================
            }
        })
        .catch(err => {
            console.log("getresetpassword -> err", err)
            // res.json({ code: code.ineternalError, message: msg.internalServerError })
            res.send('<style>*{transition:all .6s}html{height:100%}body{font-family:Lato,sans-serif;color:#888;margin:0}#main{display:table;width:100%;height:100vh;text-align:center}.fof{display:table-cell;vertical-align:middle}.fof h1{font-size:50px;display:inline-block;padding-right:12px;animation:type .5s alternate infinite}@keyframes type{from{box-shadow:inset -3px 0 0 #888}to{box-shadow:inset -3px 0 0 transparent}}</style><div id="main"><div class="fof"><h1>Your Requested Link is Expired</h1></div></div>')
        });
}
function resetpassword(req, res) {
    console.log('hell------------------------------------------------')
    let query = { resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }
    userdao.findone(query).then((result) => {
        console.log(result)
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
                    subject: "Squad XYZ: Your Password has been changed",
                    html: `Hi ${user.firstname} <br /><br /> 
                     This is a confirmation that the password for your account ${user.email} has just been changed.<br /><br />Best Regards,<br />Squad XYZ Team`
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
    // console.log('data here-----------------------------', req.body)
    const socialId = req.body.id.trim(),
        email = req.body.email.trim();
    let query = { $or: [{ socialId: socialId }, { email: email }] };
    return userdao.findone(query).then((user) => {
        if (user) {
            const fcmToken = (req.body.fcm) ? req.body.fcm : '';
            let query1 = { _id: user._id },
                update = { $set: { fcmToken: fcmToken } },
                options = { new: true }
                userdao.findOneAndUpdate(query1, update, options)

            let token = util.generateToken(user, process.env.USER_SECRET)
            let data = {
                _id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                imageUrl: user.imageUrl,
                gender: user.gender,
                contactNo: user.contactNo,
                role: user.role,
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
                gender: 'MEN', 
                isSocialLogin: true
            }
            if (req.body.photo) {
                file_name = 'img-'+Date.now()+'.png';
                var file = fs.createWriteStream('./img/' + file_name);
                var request = https.get(req.body.photo, function (response) {
                    response.pipe(file);
                });
                addobj.imageUrl = process.env.IMAGEPREFIX+''+file_name
            } else {
                addobj.imageUrl = ""
            }
            return userdao.create(addobj).then((user) => {
                DefaultPreference(user._id)
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    gender: user.gender,
                    contactNo: user.contactNo,
                    role: user.role,
                    token: token
                }
                return res.json({ code: code.ok, message: msg.loggedIn, data: data })
            })
        }
    }).catch((err) => {
        console.log("socialloginGmail -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function socialloginFacebook(req, res) {
    const socialId = req.body.id.trim(),
        email = req.body.email.trim();
    let query = { $or: [{ socialId: socialId }, { email: email }] };
    return userdao.findone(query).then((user) => {
        if (user) {
            const fcmToken = (req.body.fcm) ? req.body.fcm : '';
            let query1 = { _id: user._id },
                update = { $set: { fcmToken: fcmToken } },
                options = { new: true }
                userdao.findOneAndUpdate(query1, update, options)
            let token = util.generateToken(user, process.env.USER_SECRET)
            let data = {
                _id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                imageUrl: user.imageUrl,
                gender: user.gender,
                contactNo: user.contactNo,
                role: user.role,
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
                gender: 'MEN',
                isSocialLogin: true
            }
            if (req.body.photo) {
                file_name = 'img-'+Date.now()+'.png';
                var file = fs.createWriteStream('./img/' + file_name);
                var request = https.get(req.body.photo, function (response) {
                    response.pipe(file);
                });
                addobj.imageUrl = process.env.IMAGEPREFIX+''+file_name
            } else {
                addobj.imageUrl = ""
            }
            return userdao.create(addobj).then((user) => {
                DefaultPreference(user._id)
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    gender: user.gender,
                    contactNo: user.contactNo,
                    role: user.role,
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
            const fcmToken = (req.body.fcm) ? req.body.fcm : '';
            let query1 = { _id: user._id },
                update = { $set: { fcmToken: fcmToken } },
                options = { new: true }
                userdao.findOneAndUpdate(query1, update, options)
            let token = util.generateToken(user, process.env.USER_SECRET)
            let data = {
                _id: user._id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                imageUrl: user.imageUrl,
                gender: user.gender,
                contactNo: user.contactNo,
                role: user.role,
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
                gender: 'MEN',
                isSocialLogin: true
            }
            if (req.body.photo) {
                file_name = 'img-'+Date.now()+'.png';
                var file = fs.createWriteStream('./img/' + file_name);
                var request = https.get(req.body.photo, function (response) {
                    response.pipe(file);
                });
                addobj.imageUrl = process.env.IMAGEPREFIX+''+file_name
            } else {
                addobj.imageUrl = ""
            }
            return userdao.create(addobj).then((user) => {
                DefaultPreference(user._id)
                let token = util.generateToken(user, process.env.USER_SECRET)
                let data = {
                    _id: user._id,
                    email: user.email,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    imageUrl: user.imageUrl,
                    gender: user.gender,
                    contactNo: user.contactNo,
                    role: user.role,
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
              console.log("get profile=>",data);
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
            events: data.friends.length,
            Calendercount: data.participatedin.length
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
            if (!user) return res.send('<style>*{transition:all .6s}html{height:100%}body{font-family:Lato,sans-serif;color:#888;margin:0}#main{display:table;width:100%;height:100vh;text-align:center}.fof{display:table-cell;vertical-align:middle}.fof h1{font-size:50px;display:inline-block;padding-right:12px;animation:type .5s alternate infinite}@keyframes type{from{box-shadow:inset -3px 0 0 #888}to{box-shadow:inset -3px 0 0 transparent}}</style><div id="main"><div class="fof"><h1>Your Requested Link is Expired</h1></div></div>')
            else {
                console.log('h-----------------------------')
                res.redirect('squad://authenticate/' + user._id)
                res.render('validateemail.jade', { user });
            }
        })
        .catch(err => {
            console.log("getresetpassword -> err", err)
            res.send('<style>*{transition:all .6s}html{height:100%}body{font-family:Lato,sans-serif;color:#888;margin:0}#main{display:table;width:100%;height:100vh;text-align:center}.fof{display:table-cell;vertical-align:middle}.fof h1{font-size:50px;display:inline-block;padding-right:12px;animation:type .5s alternate infinite}@keyframes type{from{box-shadow:inset -3px 0 0 #888}to{box-shadow:inset -3px 0 0 transparent}}</style><div id="main"><div class="fof"><h1>Your Requested Link is Expired</h1></div></div>')
            // res.json({ code: code.ineternalError, message: msg.internalServerError })
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

function latlongtokm(userlong, userlat, eventlong, eventlang) {
    let km = geolib.getDistance(
        { latitude: userlong, longitude: userlat },
        { latitude: eventlong, longitude: eventlang }
    );
    return km
}

async function peoplearound(req, res) {// db.users.createIndex( {location: "2dsphere" } )
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)

    user.findOne({ _id: obj.id }).then(async (userdata) => {

        const { level, gender, sportId } = req.body;
        const { lat, long } = req.query;
        var query = {}

        if (level) {
            query.preferences = { $elemMatch: { "level": { $in: level }, "sportId": { $in: [sportId] } } }
            if (JSON.stringify(level) == JSON.stringify(['ALL'])) {
                query.preferences = { $elemMatch: { "level": { $in: ['BEGINNER', 'INTERMEDIATE', 'ALL', 'ADVANCED'] }, "sportId": { $in: [sportId] } } }
            }
        }
        if (gender) {
            query.gender = { $in: gender }
            if (JSON.stringify(gender) == JSON.stringify(['BOTH'])) {
                query.gender = { $in: ['MEN', 'WOMEN'] }
            }
        }
        var meters = 30000
        if (req.query.radius) {
            meters = parseInt(req.query.radius) * 1000
        }
        // if (lat && long) {
        //     let distance = latlongtokm(userdata.location.coordinates[0], userdata.location.coordinates[1], long, lat)
        //     meters = distance
        // }
        if (parseInt(req.query.radius) != 0) {
            if (lat && long) {
                query.location = {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [long, lat]
                        },
                        $maxDistance: meters
                    }
                }
            } else {
                query.location = {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [userdata.location.coordinates[0], userdata.location.coordinates[1]]
                        },
                        $maxDistance: meters
                    }
                }
            }
        }
        query._id = { $nin: { _id: obj.id } }
        console.log(query)

        user.find(query, '_id firstname lastname imageUrl').exec((err, data) => {//have to add friend flag here
            if (err) {
                console.log("peoplearound -> err", err)
                return res.json({ code: code.internalError, message: msg.internalServerError })
            } else {
                // return res.send({data: data.length})
                console.log(data.length)

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
    })
}
function invitepeople(req, res) {
    let token = req.headers['authorization'];
    let userId = util.decodeToken(token)
    // console.log(userId.id, 'kk')
    req.user_id = userId.id
    var { users, eventId } = req.body;
    
    var obj = []
    users = users.filter(e => e !== userId.id);
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
            if (i == (users.length - 1)) {
                addgameinvitation(obj, userId.id, eventId)
                invitemail(res, req, obj, eventId);
            }
        }).catch((err) => {
            console.log("invitepeople -> err", err)
        })
    })

    var manualinv = req.body.manualInvite
    manualinv.map(async (el, index) => {
        obj.push(el);
        if (index == (manualinv.length - 1)) {
            invitManualemail(res, req, obj, eventId);
        }
    })
}
async function addgameinvitation(userlist, sederId, eventId) {
    console.log("addgameinvitation func 1 -> userlist", userlist, sederId, eventId)
    userlist.map((el) => {
        let invitation = {
            senderId: sederId,
            eventId: eventId,
            createdAt: new Date()
        };
        if (el.userid) {
            let query = { _id: el.userid },
                update = { $push: { invitationtogame: invitation } },
                options = { new: true };
            user.findOneAndUpdate(query, update, options).then((data) => {
                // console.log("addgameinvitation -> data", data)

            }).catch((err) => {
                console.log("addgameinvitation -> err", err)

            })
        }
    })
}

function notificationCount(req, res) {
    let token = req.headers['authorization'],
    obj = util.decodeToken(token);

    let query = { _id: obj.id };
    user.findOne(query).then((data) => {

        var invitationCount = []
        for(let i = 0; i < data.invitationtogame.length; i++){
            if(data.invitationtogame[i].notify == 0){
                invitationCount.push(data.invitationtogame[i].notify)
            }
        }

        var rateyouNotificationCount = []
        for(let i = 0; i < data.rateyouNotification.length; i++){
            if(data.rateyouNotification[i].notify == 0){
                rateyouNotificationCount.push(data.rateyouNotification[i].notify)
            }
        }

        var joineventNotificationCount = []
        for(let i = 0; i < data.joineventNotification.length; i++){
            if(data.joineventNotification[i].notify == 0){
                joineventNotificationCount.push(data.joineventNotification[i].notify)
            }
        }

        var friendrequestNotificationCount = []
        for(let i = 0; i < data.friendrequestNotification.length; i++){
            if(data.friendrequestNotification[i].notify == 0){
                friendrequestNotificationCount.push(data.friendrequestNotification[i].notify)
            }
        }

        var eventhappenNotificationCount = []
        for(let i = 0; i < data.eventhappenNotification.length; i++){
            if(data.eventhappenNotification[i].notify == 0){
                eventhappenNotificationCount.push(data.eventhappenNotification[i].notify)
            }
        }

        var eventafterhourNotificationCount = []
        for(let i = 0; i < data.eventafterhourNotification.length; i++){
            if(data.eventafterhourNotification[i].notify == 0){
                eventafterhourNotificationCount.push(data.eventafterhourNotification[i].notify)
            }
        }

        var rateplayerNotificationCount = []
        for(let i = 0; i < data.rateplayerNotification.length; i++){
            if(data.rateplayerNotification[i].notify == 0){
                rateplayerNotificationCount.push(data.rateplayerNotification[i].notify)
            }
        }

        var rateallNotificationCount = []
        for(let i = 0; i < data.rateallNotification.length; i++){
            if(data.rateallNotification[i].notify == 0){
                rateallNotificationCount.push(data.rateallNotification[i].notify)
            }
        }

        var eventfullNotificationCount = []
        for(let i = 0; i < data.eventfullNotification.length; i++){
            if(data.eventfullNotification[i].notify == 0){
                eventfullNotificationCount.push(data.eventfullNotification[i].notify)
            }
        }

        return res.json({
            code: code.ok, data: joineventNotificationCount.length +
                friendrequestNotificationCount.length +
                eventhappenNotificationCount.length +
                eventafterhourNotificationCount.length +
                invitationCount.length +
                rateyouNotificationCount.length +
                eventfullNotificationCount.length +
                rateallNotificationCount.length +
                rateplayerNotificationCount.length
        })

    }).catch((err) => {
        console.log(err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

function removeNotificationCount(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)



    let query = { _id: obj.id }
    let update = {
        $set: {
            'invitationtogame.$[].notify': 1,
            'rateyouNotification.$[].notify': 1,
            'joineventNotification.$[].notify': 1,
            'friendrequestNotification.$[].notify': 1,
            'eventhappenNotification.$[].notify': 1,
            'eventafterhourNotification.$[].notify': 1,
            'rateplayerNotification.$[].notify': 1,
            'rateallNotification.$[].notify': 1,
            'eventfullNotification.$[].notify': 1,
        }
    }

    console.log(query, update)

    user.updateOne(query, update).exec((err, data) => {

        if(err){
            return res.json({ code: code.ineternalError, message: msg.internalServerError })
        } else {
            return res.json({ code: code.ok, data: 'Successfully' })
        }
    })
}

async function gamenotification(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    // console.log("gamenotification -> obj", obj)
    let query = { _id: obj.id };
    await user.findOne(query)
        // "NotificationType": "invitenotification"
        .populate('invitationtogame.senderId', '_id firstname lastname imageUrl sport')
        .populate('invitationtogame.eventId', '_id date starttime endtime Address sport')
        .populate('rateyouNotification.userId', '_id firstname lastname imageUrl sport')
        .populate('rateyouNotification.eventId', '_id date starttime endtime Address sport')
        // "NotificationType": "joineventnotification"
        .populate('joineventNotification.userId', '_id firstname lastname imageUrl sport')
        .populate('joineventNotification.eventId', '_id date starttime endtime Address sport')
        //eventfull "NotificationType":"eventfullNotification"
        .populate('eventfullNotification.eventId', '_id date starttime endtime Address sport')
        // "NotificationType": "eventhappennotification"
        .populate('eventhappenNotification.eventId', '_id date starttime endtime Address sport')
        // "NotificationType": "eventaftertimenotification"
        .populate('eventafterhourNotification.eventId', '_id date starttime endtime Address sport')
        //" NotificationType  " :  ratenotification
        .populate('rateplayerNotification.eventId', '_id date starttime endtime Address sport')
        //" NotificationType  " :  ratenotification
        .populate('rateallNotification.eventId', '_id date starttime endtime Address sport')
        .then((data) => {
            let gameinvitationnotification = []
            if (data.rateyouNotification) {
                data.rateyouNotification.map((rtyou) => {
                    rtyou = {
                        ...rtyou._doc,
                        "notificationType": "rateyouNotification"
                    }
                    gameinvitationnotification.push(rtyou)
                })
            }
            if (data.invitationtogame) {
                data.invitationtogame.map((rtyou) => {
                    rtyou = {
                        ...rtyou._doc,
                        "notificationType": "invitationtogame"
                    }
                    gameinvitationnotification.push(rtyou)
                })
            }
            if (data.joineventNotification) {
                data.joineventNotification.map((joevent) => {
                    joevent = {
                        ...joevent._doc,
                        "notificationType": "joineventnotification"
                    }
                    gameinvitationnotification.push(joevent)
                })
            }
            if (data.eventhappenNotification) {
                data.eventhappenNotification.map((eventhapp) => {
                    eventhapp = {
                        ...eventhapp._doc,
                        "notificationType": "eventhappenNotification"
                    }
                    gameinvitationnotification.push(eventhapp)
                })
            }

            if (data.eventafterhourNotification) {
                data.eventafterhourNotification.map((eventhappone) => {
                    eventhappone = {
                        ...eventhappone._doc,
                        "notificationType": "eventafterhourNotification"
                    }
                    gameinvitationnotification.push(eventhappone)
                })
            }
            if (data.rateplayerNotification) {
                data.rateplayerNotification.map((rtplayer) => {
                    rtplayer = {
                        ...rtplayer._doc,
                        "notificationType": "rateplayerNotification"
                    }
                    gameinvitationnotification.push(rtplayer)
                })
            }
            if (data.rateallNotification) {
                data.rateallNotification.map((rtall) => {
                    rtall = {
                        ...rtall._doc,
                        "notificationType": "rateallNotification"
                    }
                    gameinvitationnotification.push(rtall)
                })
            }
            if (data.eventfullNotification) {
                data.eventfullNotification.map((rtall) => {
                    rtall = {
                        ...rtall._doc,
                        "notificationType": "eventfullNotification"
                    }
                    gameinvitationnotification.push(rtall)
                })
            }
            //sort by date...
            gameinvitationnotification.sort(function(a,b){
                if(new Date(b.createdAt) > new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000))) && new Date(a.createdAt) > new Date((new Date().getTime() - (30 * 24 * 60 * 60 * 1000)))){
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
            });

            res.json({ code: code.ok, gamenotification: gameinvitationnotification })
        }).catch((err) => {
            console.log("gamenotification -> err", err)
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })
}
function removegamenotification(req, res) {
    let token = req.headers['authorization']
    let obj = util.decodeToken(token)
    let query = { _id: obj.id },
        update = { $pull: { joineventNotification: { "_id": ObjectId(req.query._id) } } },
        options = { new: true };
    return userdao.findOneAndUpdate(query, update, options).then((data) => {
        console.log(data)
        if (data) {
            res.json({ code: code.ok, msg: msg.removeNotification })
        }
    }).catch((err) => {
        console.log("joinevent -> err", err)
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
    // console.log("invitemail function 2-> users", users, eventId)
    let usersemail = [];
    // console.log(users)

    event.findOne({ _id: eventId }).populate('sport', '_id name image').then((eventData) => {
        var dateTime = dateFormat(new Date(eventData.date), "dddd dd/mm");
        var dateStartTime = dateFormat(new Date(eventData.starttime), "h:MM TT")
        var dateendTime = dateFormat(new Date(eventData.endtime), "h:MM TT")
        var eventTime = dateTime + ',  ' + dateStartTime + ' - ' + dateendTime

        user.findOne({ _id: req.user_id }, { firstname: 1 }).then((senderName) => {

            users.map(async (el, i) => {
                let userId = (el.userid) ? el.userid : ''
                let link = "http://" + req.headers.host + "/user/getinvite/" + eventId + '/' + userId;
                usersemail.push(el.email)
                let data = {
                    username: el.firstname,
                    subject: "Squad XYZ: Invitation Link",
                    html: `<h4>Hi ${el.firstname}, <br /><br />
                ${senderName.firstname} has invited you to the event. <br /><br />

            <img src="${eventData.sport.image}" width="10px"> &nbsp;<b>${eventData.sport.name}</b><br />
            <img src="https://image.flaticon.com/icons/png/512/2088/2088617.png" width="12px"> &nbsp;<a href="${link}">${eventTime}</a><br />
            <img src="https://image.flaticon.com/icons/png/512/684/684809.png" width="12px"> &nbsp;${eventData.Address}<br />
            <img src="https://image.flaticon.com/icons/png/512/61/61584.png" width="12px"> &nbsp;${eventData.price} AED<br />
            <img src="https://image.flaticon.com/icons/png/512/1161/1161469.png" width="12px"> &nbsp;Who's in ?<br /><br />

            Best Regards,<br />
            Squad XYZ Team</h4>`
                }
                await util.sendEMail(el.email, data).then((data) => {
                    let fcm_token = (el.fcmToken) ? el.fcmToken : '';
                    let title = `${senderName.firstname} invite you in event`
                    FirebaseNotification(fcm_token, title)
                    if ((data == true) && (i == (users.length - 1))) {
                        return res.json({ code: code.ok, msg: `Invitation send to ${usersemail}` })
                    }
                }).catch((err) => {
                    console.log("invitemail -> err", err)

                })
            })
        })
    })
}

async function invitManualemail(res, req, users, eventId) {
    // console.log("invitemail function 2-> users", users, eventId)
    let usersemail = [];
    users.map(async (el, i) => {
        // console.log("invitemail -> el", el.email)
        
        let PlayStore = "https://play.google.com/store/apps/details?id=com.squadxyz";
        let Appstore = "https://play.google.com/store/apps/details?id=com.squadxyz";
        usersemail.push(el.email)
        let userExist = await user.find({email: el.email})
        // let userId = (userExist[0]._id) ? userExist[0]._id : ''
        
        if (userExist[0]) {
            let link = "http://" + req.headers.host + "/user/getinvite/" + eventId + '/' + userExist[0]._id;
            var Body_data = `Hi ${el.firstname}, <br /><br />
                Someone has invited you to the event. Click on this link and join here:<a href="${link}">Squad XYZ</a> <br /><br />
                Best Regards,<br />
                Squad XYZ Team`;
        } else {
            var Body_data = `Hi ${el.firstname}, <br /><br />
                Someone has invited you to the event. Click on this link and Download App: <br /> 
                Playstore: <a href="${PlayStore}">Squad XYZ</a><br /> 
                Appstore: <a href="${Appstore}">Squad XYZ</a> <br /><br />
                Best Regards,<br />
                Squad XYZ Team`;
        }

        var data = {
            username: el.firstname,
            subject: "Squad XYZ: Invitation Link",
            html: Body_data
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
            const { sportId } = req.query;
            var query = {}
            query._id = {$nin: {_id: obj.id}}
            query.preferences = { $elemMatch: { "sportId": {$in: [sportId]} } }
            await user.find(query).then((data) => {
                console.log(data.length)
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

    user.findOne({ _id: obj.id }, { firstname: 1 }).then((senderName) => {
    
    ratearray.map((ele, index) => {
        // console.log("addRatingasplayer -> ele", ratearray.length, index + 1)
        let rating = {
            by: obj.id,
            ratedwith: ele.rate,
            eventId: ele.eventId
        }
        let query = { _id: ele.userId },
            update = { $push: { "rateasplayer": rating } },
            options = { new: true };
        userdao.findOneAndUpdate(query, update, options).then((userdata) => {
            if(obj.id != ele.userId){
                addratingnotif(rateas.player, obj.id, ele.userId, ele.eventId)
                (userdata.fcmToken) ? FirebaseNotification(userdata.fcmToken, `${senderName.firstname} rate you`) : '';
            }
        }).catch((err) => {
            return res.json({ code: code.internalError, message: msg.internalServerError })
            // console.log("addRating -> err==================================", err)
        })
        if (ratearray.length == index + 1) {
            return res.json({ code: code.ok, msg: msg.addrate })
        }
    })
})
}
function addRatingasorganizer(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)
    const { rate, userId, eventId } = req.body;
    var GiveNotify = true
    if(obj.id != userId){
        GiveNotify = false
    }
    let rating = {
        by: obj.id,
        ratedwith: rate,
        eventId: eventId
    }
    let query = { _id: userId },
        update = { $push: { "rateasorganizer": rating } },
        options = { new: true };
    userdao.findOneAndUpdate(query, update, options).then((userdata) => {
        if(GiveNotify){
            console.log(obj.id, userId, '=======================================>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
            addratingnotif(rateas.organizer, obj.id, userId, eventId);
        }
        (userdata.fcmToken) ? rateyounotification(userdata.fcmToken) : '';
        return res.json({ code: code.ok, msg: msg.addrate })
    }).catch((err) => {
        // console.log("addRating -> err===============================", err)
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}
function addratingnotif(type, senderId, receiverId, eventId) {

    let rateyouNotification = {
        type: type,
        userId: senderId,
        eventId: eventId,
        createdAt: new Date()
    };

    let query = { _id: receiverId },
        update = { $push: { rateyouNotification: rateyouNotification } },
        options = { new: true };
    user.findOneAndUpdate(query, update, options).then((data) => {

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
    user.findOne({ _id: userId, friends: { $in: [obj.id] } }).then((data) => {
        console.log(data, '===================================')
        if (data) {
            return res.json({ code: code.ok, msg: "user are aready your friend" })
        } else {
            user.findOne({ _id: obj.id }, { firstname: 1 }).then((senderName) => {
            userdao.findOneAndUpdate(query, update, options).then((receiverdata) => {
                FirebaseNotification(receiverdata.fcmToken, `${senderName.firstname} wants to be your friend`);
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
        })
        }
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
function friendrequestNotification(senderId, receiverId) {
    let friendrequestNotification = {
        userId: senderId,
        createdAt: new Date()
    };

    let query = { _id: receiverId },
        update = { $push: { friendrequestNotification: friendrequestNotification } },
        options = { new: true };
    user.findOneAndUpdate(query, update, options).then((data) => {
        // console.log("friendrequestNotification -> data", data)
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
            removeFriendNotif(obj.id, userId)
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
            removeFriendNotif(obj.id, userId)
            return res.json({ code: code.ok, msg: "request declined" })
        })
    }).catch((err) => {
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })
}
function removeFriendNotif(userId, requestuserId) {
    let query = { _id: userId },
        update = { "$pull": { friendrequestNotification: { "userId": ObjectId(requestuserId) } } },
        options = { new: true };
    user.findOneAndUpdate(query, update, options).then(data => {

    }).catch(err => {

    })

}
function removeJoineventInviteNotif(userId, senderId, eventId) {
    console.log("userId, senderId, eventId", userId, senderId, eventId)
    let query = { _id: userId },
        update = { "$pull": { invitationtogame: { "senderId": ObjectId(senderId), "eventId": ObjectId(eventId) } } },
        options = { new: true };
    user.findOneAndUpdate(query, update, options).then(data => {

    }).catch(err => {

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
    let user_Id = req.query.userId
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
        userdao.findone({ _id: user_Id }).then((userdata) => {
            console.log("userdetail -> userdata================", userdata)
            let Obj = {
                "imageUrl": (userdata.imageUrl) ? userdata.imageUrl : '',
                "totalfriends": (userdata.friends) ? userdata.friends.length : 0,
                "firstname": (userdata.firstname) ? userdata.firstname : "",
                "lastname": (userdata.lastname) ? userdata.lastname : "",
                "dob": (userdata.dob) ? userdata.dob : "",
                "email": (userdata.email) ? userdata.email : "",
                "gender": (userdata.gender) ? userdata.gender : "",
                "contactNo": (userdata.contactNo) ? userdata.contactNo : "",
                "Noofeventplayed": (userdata.participatedin) ? userdata.participatedin.length : 0,
                "rateasorganizer": (userdata.rateasorganizer) ? rateasorganizer / userdata.rateasorganizer.length : "",
                "rateasplayer": (userdata.rateasplayer) ? rateasplayer / userdata.rateasplayer.length : "",
                "friendshipstatus": friendstatus

            }
            res.json({ code: code.ok, data: Obj })
        })


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
function FirebaseNotification(fcmToken, title) {//sent to user
    var payload = {
        notification: {
            color: '#ff0000',
            title: title
        }
    }
    var options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    }
    // var token = fcmToken ? fcmToken : '';

    if(fcmToken){
        admin.messaging().sendToDevice(fcmToken, payload, options)
        .then((response) => {
            return 'success';
        })
        .catch((error) => {
            console.log('error', error)
        })
    }
    
}

function rateyounotification(fcmToken) {
    var payload = {
        notification: {
            title: 'Someone rate you'
        }
    }
    var options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    }
    var token = fcmToken ? fcmToken : 'fJEiwtwfRAW1OH8Ea-FrGs:APA91bHUAQDiDf15Z3baGUkPMHcdwyLYb7adywAYW6YXPGcS4GLy-KyyKkr78SYxpj0AJ0IslZdW1DUuizlCOJVBTn_z1UXzNN5do-4jlT049PjuHumU5l3MyGJmm-b_0rBAEVfCPF1R';
    admin.messaging().sendToDevice(token, payload, options)
        .then((response) => {
        })
        .catch((error) => {
            console.log('error', error)
        })
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
    // console.log("invitenotification -> users", users)
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
            // console.log("Successfully sent with response: ", response);
        }
    });
}
function logout(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token);
    let query = { _id: obj.id },
        update = { $set: { fcmToken: "" } },
        options = { new: true }
    userdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok })
    }).catch((err) => {
        console.log("update -> err", err)
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
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
    invitemail,
    peoplecount,
    FirebaseNotification,
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
    removegamenotification,
    gamenotifdecline,
    listorsentrequest,
    canclerequest,
    unfriend,
    userdetail,
    getuserpreference,
    addratingnotif,
    friendrequestNotification,
    friendnotification,
    removeJoineventInviteNotif,
    getFcm,
    DefaultPreference,
    notificationCount,
    removeNotificationCount,
    logout
}