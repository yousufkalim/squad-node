const service = require('./userService')


function registerUser(req, res,next) {
    service.registerUser(req, res,next)
}
function loginUser(req, res,next) {
    service.loginUser(req, res,next)
}

function forgotPassword(req, res,next) {
    service.forgotPassword(req, res,next)
}
function getresetpassword(req, res,next) {
    service.getresetpassword(req, res,next)
}
function resetpassword(req, res,next) {
    service.resetpassword(req, res,next)
}



module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    getresetpassword,
    resetpassword
  
}