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
function getprofile(req, res,next) {
    service.getprofile(req, res,next)
}
function socialloginGmail(req, res) {
    service.socialloginGmail(req, res)
}
function socialloginFacebook(req, res) {
    service.socialloginFacebook(req, res)
}
function socialloginLinkedin(req, res) {
    service.socialloginLinkedin(req, res)
}
function update(req, res) {
    service.update(req, res)
}


module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    getresetpassword,
    resetpassword,
    socialloginGmail,
    socialloginFacebook,
    socialloginLinkedin,
    getprofile,
    update
  
}