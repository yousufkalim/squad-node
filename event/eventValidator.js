
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const userdao = require('../user/userDao');
const util = require('../app util/util');
const jwt = require('jsonwebtoken');

async function verifyToken(req, res, next) {
    // console.log("verifyToken -> req.headers", req.headers)
    let token = req.headers['authorization']
    // console.log("verifyToken -> token", token)
    await jwt.verify(token, process.env.USER_SECRET, (err) => {
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
                    next();
                }
            }).catch((err) => {
                return res.json({ code: code.internalError, message: msg.internalServerError }) //msg.internalServerError })
            })
        }
    })
}
function verifylatlong(req, res, next) {
    var longitude = req.body.location.coordinates[0],
        latitude = req.body.location.coordinates[1];
    if (req.body.location) {
        if ((-90 <= latitude <= 90) && (-180 <= longitude <= 180)) {
            next();
        } else if (!((-90 <= latitude <= 90) && (-180 <= longitude <= 180))) {
            return res.json({ code: code.badRequest, message: msg.latlongincorrect })
        }
    }
}
module.exports = {

    verifyToken,
    verifylatlong


}