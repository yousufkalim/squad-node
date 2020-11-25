const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const userdao = require('../user/userDao');
const bcrypt = require('bcrypt');
const user = require('../schema/user')
const crypto = require('crypto');
const { role } = require('../constants');
const env = require('dotenv').config()
function listuser(req, res) {
    let query = { role: role.user }
    userdao.find(query).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}

function userdetail(req, res) {
    let query = { _id: req.query.userId }
    userdao.findone(query).then((data) => {
        let response = {
            active: data.active,
            _id: data._id,
            name: data.name,
            email: data.email,
            contactNo: data.contactNo,
            imageUrl: data.imageUrl
        }

        return res.json({ code: code.ok, data: response })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function updateuser(req, res) {
    let query = { _id: req.query.userId },
        update = { $set: req.body },
        options = { new: true }
    userdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function deactiveuser(req, res) {
    let query = { _id: req.query.userId },
        update = { $set: { active: req.body.active } },
        options = { new: true }
    userdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function deleteuser(req, res) {
    let query = { _id: req.query.userId }

    userdao.remove(query).then((data) => {
        console.log("deleteuser -> data", data)
        if (data.deletedCount == 1) {
            return res.json({ code: code.ok, messages: msg.userdeleted })
        }else{
            return res.json({code:code.notFound,messages:msg.notFound})
        }
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function resetpassword(req, res) {
    const newpass = util.generateRandomPassword().toUpperCase()
    const hash = bcrypt.hashSync(newpass, bcrypt.genSaltSync(10))
    let query = { _id: req.query.userId },
        update = { $set: { password: hash } },
        options = { new: true }
    return userdao.findOneAndUpdate(query, update, options).then(async (result) => {
        let obj = {
            username: result.name,
            subject: "New Password",
            html: `Hi ${result.name} \n 
            // Your password has been reset here is your new password ${newpass}\n`
        }
        await util.sendEMail(result.email, obj).then(async (result) => {
            (result == true) ? res.json({ code: code.ok, message: msg.passwordreset })
                : res.json({ code: code.ok, message: msg.mailnotsend })
        })
        // res.json({ code: code.ok, message: msg.passwordreset })
    }).catch((err) => {
        console.log("createUser -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
module.exports = {
    listuser,
    userdetail,
    updateuser,
    deactiveuser,
    deleteuser,
    resetpassword

}