const service = require('./userService')


function registerUser(req, res, next) {
    service.registerUser(req, res, next)
}
function loginUser(req, res, next) {
    service.loginUser(req, res, next)
}

function forgotPassword(req, res, next) {
    service.forgotPassword(req, res, next)
}
function verifyToken(req, res, next) {
    service.verifyToken(req, res, next)
}
function getresetpassword(req, res, next) {
    service.getresetpassword(req, res, next)
}
function resetpassword(req, res, next) {
    service.resetpassword(req, res, next)
}
function getprofile(req, res, next) {
    service.getprofile(req, res, next)
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
function sportlist(req, res) {
    service.sportlist(req, res)
}
function loginAdmin(req, res) {
    service.loginAdmin(req, res)
}
function createpreference(req, res) {
    service.createpreference(req, res)
}
function getpreference(req, res) {
    service.getpreference(req, res)
}
function updatepreference(req, res) {
    service.updatepreference(req, res)
}
function getvalidateemail(req, res) {
    service.getvalidateemail(req, res)
}
function validateemail(req, res) {
    service.validateemail(req, res)
}
function removepreference(req, res) {
    service.removepreference(req, res)
}
function peoplearound(req, res) {
    service.peoplearound(req, res)
}
function invitepeople(req, res) {
    service.invitepeople(req, res)
}
function peoplecount(req, res) {
    service.peoplecount(req, res)
}
function addRatingasplayer(req, res) {
    service.addRatingasplayer(req, res)
}
function addRatingasorganizer(req, res) {
    service.addRatingasorganizer(req, res)
}
function getinvite(req, res) {
    service.getinvite(req, res)
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
    peoplecount,
    addRatingasplayer,
    addRatingasorganizer,
    getinvite
}