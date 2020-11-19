const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const userdao = require('./userDao');
const bcrypt = require('bcrypt');
const user = require('../schema/user')
const crypto = require('crypto');
const env = require('dotenv').config()
function registerUser(req, res) {
    // const newpass = util.generateRandomPassword().toUpperCase()
    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
    req.body.password = hash;
    const data = req.body

    return userdao.create(data).then(async (result) => {
        res.json({ code: code.created, message: msg.registered })
    }).catch((err) => {
        console.log("createUser -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}


function loginUser(req, res) {
    return user.findOne({ email: req.body.email }).populate('nursery', '_id name').then(async (result) => {
        if (result) {
            console.log("loginUser -> result", result.nursery)
            const match = await bcrypt.compare(req.body.password, result.password);
            if (match) {
                let tokn = util.generateToken(result, process.env.USER_SECRET)

                var data = {
                    _id: result._id,
                    name: result.name,
                    email: result.email,
                    contactNo: result.contactNo,
                    token: tokn
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
                    username: user.name,
                    subject: "Reset Password Link",
                    html: `Hi ${user.name} \n 
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
    let query = { resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }
    userdao.findone(query)
        .then((user) => {
            if (!user) return res.json({ code: code.unAuthorized, message: msg.tokeninvalidorexpire })
            else res.render('reset.jade', { user });
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
                    username: user.name,
                    subject: "Your Password has been changed",
                    html: `Hi ${user.name} \n 
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

// function uploadPhoto(req, res) {
//     req.newFile_name = [];
//     console.log("in upload photo", req.newFile_name)
//     util.upload(req, res, async function (err) {
//         if (err) {
//             return res.json({ code: code.badRequest, message: err })
//         }
//         else {
//             const files = req.files;
//             let index, len;
//             var filepathlist = []
//             for (index = 0, len = files.length; index < len; ++index) {
//                 console.log("uploadPhoto -> files[index].path", files[index].path)
//                 let filepath = process.env.IMAGEPREFIX + files[index].path.slice(4,);;
//                 filepathlist.push(filepath)
//             }
//             return res.json({ code: code.created, message: msg.ok, data: filepathlist })
//         }
//     });
// }

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
module.exports = {
    registerUser,
    // updateProfile,
    loginUser,
    // uploadPhoto,
    forgotPassword,
    getresetpassword,
    resetpassword
}