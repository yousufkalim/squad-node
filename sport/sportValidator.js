
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const commondao = require('../common/commonDao');
const util = require('../app util/util');
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client();
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
  let token = req.headers['authorization']
    await jwt.verify(token, process.env.USER_SECRET, (err) => {   
        if (err) {
            return res.json({ code: code.unAuthorized, message: msg.invalidToken })
        }
        else {
            let obj = util.decodeToken(token)    
            let query = { _id: obj.id }
            commondao.findone(query).then((data) => {

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
async function validateUpdate(req, res, next) {
    const { email, role } = req.body;
    if (!email && !role) {
        next()
    }
    else {
        return res.json({ code: code.badRequest, message: msg.invalidBody })
    }
}

async function verifyAdminToken(req, res, next) {  
    let token = req.headers['authorization']
      await jwt.verify(token, process.env.ADMIN_SECRET, (err) => {   
          if (err) {
              return res.json({ code: code.unAuthorized, message: msg.invalidToken })
          }
          else {
              let obj = util.decodeToken(token)    
              let query = { _id: obj.id }
              commondao.findone(query).then((data) => {
  
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
module.exports = {
    validateLogin,
    verifyToken,
    validateUpdate,
    verifyAdminToken
}