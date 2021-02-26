
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const userdao = require('../user/userDao');
const util = require('../app util/util');
const jwt = require('jsonwebtoken');
const { role } = require('../constants');
async function validateLogin(req, res, next) {
    const { email, password } = req.body;
    if (email && password) {

        next()
    }
    else {
        return res.json({ code: code.badRequest, message: msg.invalidBody })
    }
}
async function verifyToken(req, res, next) {
    // console.log("verifyToken -> req.headers", req.headers)
    let token = req.headers['authorization']
    // console.log("verifyToken -> token", token)
    await jwt.verify(token, process.env.ADMIN_SECRET, (err) => {
        // console.log("verifyToken -> err", err)
        if (err) {
            return res.json({ code: code.unAuthorized, message: msg.invalidToken })
        }
        else {
            let obj = util.decodeToken(token)
            // console.log("verifyToken -> obj", obj)
            let query = { _id: obj.id }
            userdao.findone(query).then((data) => {

                if (!data) {
                    return res.json({ code: code.unAuthorized, message: msg.invalidToken })
                } else {
                    if (data.role == role.admin) {

                        next();
                    }
                    else {
                        return res.json({ code: code.unAuthorized, message: msg.youcantaccess })
                    }

                }
            }).catch((err) => {
                return res.json({ code: code.internalError, message: msg.internalServerError }) //msg.internalServerError })
            })
        }
    })
}
async function validateupdate(req, res, next) {
    const { email } = req.body;
    if (!email) {

        next()
    }
    else {
        return res.json({ code: code.badRequest, message: msg.invalidBody })
    }
}

module.exports = {
    validateLogin,
    verifyToken,
    validateupdate

}