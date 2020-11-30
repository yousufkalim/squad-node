const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const sportdao = require('./sportDao');
const bcrypt = require('bcrypt');

const crypto = require('crypto');
const { role } = require('../constants');
const env = require('dotenv').config()

function addsport(req, res) {
    const data = req.body
    return sportdao.create(data).then(async (result) => {
        res.json({ code: code.created, message: msg.sportadded })
    }).catch((err) => {
        console.log("createUser -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}


function listsport(req, res) {
    sportdao.find().then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}

// function userdetail(req, res) {
//     let query = { _id: req.query.userId }
//     userdao.findone(query).then((data) => {
//         let response = {
//             active: data.active,
//             _id: data._id,
//             name: data.name,
//             email: data.email,
//             contactNo: data.contactNo,
//             imageUrl: data.imageUrl
//         }

//         return res.json({ code: code.ok, data: response })
//     }).catch((err) => {
//         return res.json({ code: code.ineternalError, messages: msg.internalServerError })
//     })
// }
function updatesport(req, res) {
    let query = { _id: req.query.sportId },
        update = { $set: req.body },
        options = { new: true }
        sportdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function deactivesport(req, res) {
    let query = { _id: req.query.sportId },
        update = { $set: { status: req.body.status } },
        options = { new: true }
    sportdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function deletesport(req, res) {
    let query = { _id: req.query.sportId }

    sportdao.remove(query).then((data) => {
       
        if (data.deletedCount == 1) {
            return res.json({ code: code.ok, messages: msg.sportdeleted })
        }else{
            return res.json({code:code.notFound,messages:msg.notFound})
        }
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
// function resetpassword(req, res) {
//     const newpass = util.generateRandomPassword().toUpperCase()
//     const hash = bcrypt.hashSync(newpass, bcrypt.genSaltSync(10))
//     let query = { _id: req.query.userId },
//         update = { $set: { password: hash } },
//         options = { new: true }
//     return userdao.findOneAndUpdate(query, update, options).then(async (result) => {
//         let obj = {
//             username: result.name,
//             subject: "New Password",
//             html: `Hi ${result.name} \n 
//             // Your password has been reset here is your new password ${newpass}\n`
//         }
//         await util.sendEMail(result.email, obj).then(async (result) => {
//             (result == true) ? res.json({ code: code.ok, message: msg.passwordreset })
//                 : res.json({ code: code.ok, message: msg.mailnotsend })
//         })
//         // res.json({ code: code.ok, message: msg.passwordreset })
//     }).catch((err) => {
//         console.log("createUser -> err", err)
//         res.json({ code: code.ineternalError, message: msg.internalServerError })
//     })
// }
module.exports = {
    addsport,
    listsport,
    // userdetail,
    updatesport,
    deactivesport,
    deletesport,
    // resetpassword

}