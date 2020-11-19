
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const commondao = require('../common/commonDao');
const util = require('../app util/util');
const jwt = require('jsonwebtoken')
async function validateBody(req, res, next) {
    const { email, name, password, contactNo, role } = req.body;
    if (email && name && password && contactNo && role) {
        if (name) {
            let query = { email: email }
            if (await commondao.findone(query)) {
                return res.json({ code: code.badRequest, message: msg.emailAlreadyRegistered });
            }
            else {
                if (util.validateEmail(email)) {
                    next()
                } else {
                    return res.json({ code: code.badRequest, message: msg.invalidEmailPass })
                }
            }
        }
        // next()
    }
    else {
        return res.json({ code: code.badRequest, message: msg.invalidBody })
    }
}
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
    console.log("verifyToken -> req.headers", req.headers)
    let token = req.headers['authorization']
    console.log("verifyToken -> token", token)
    await jwt.verify(token, process.env.USER_SECRET, (err) => {
        console.log("verifyToken -> err", err)
        if (err) {
            return res.json({ code: code.unAuthorized, message: msg.invalidToken })
        }
        else {
            let obj = util.decodeToken(token)
            console.log("verifyToken -> obj", obj)
            let query = { _id: obj.id }
            commondao.findone(query).then((data) => {

                if (!data) {
                    return res.json({ code: code.unAuthorized, message: msg.invalidToken })
                } else {

                    next();

                }
            }).catch((err) => {
                return res.json({ code: code.internalError, message: msg.internalServerError }) //msg.internalServerError })
            })
        }
    })
}
async function validateUpdate(req, res, next) {
    const { email, role } = req.body;
    if (!email && !role) {
        next()
    }
    else {
        return res.json({ code: code.badRequest, message: msg.invalidBody })
    }
}
module.exports = {
    validateBody,
    validateLogin,
    verifyToken,
    validateUpdate

}