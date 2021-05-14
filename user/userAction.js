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
function peoplenewtosquad(req, res) {
    service.peoplenewtosquad(req, res)
}
function peopleimet(req, res) {
    service.peopleimet(req, res)
}
function listforfriendrequest(req, res) {
    service.listforfriendrequest(req, res)
}
function sendrequest(req, res) {
    service.sendrequest(req, res)
}
function requestlist(req, res) {
    service.requestlist(req, res)
}
function friendlist(req, res) {
    service.friendlist(req, res)
}
function acceptrequest(req, res) {
    service.acceptrequest(req, res)
}
function declinerequest(req, res) {
    service.declinerequest(req, res)
}
function gamenotification(req, res) {
    service.gamenotification(req, res)
}
function removegamenotification(req, res) {
    service.removegamenotification(req, res)
}
function getFcm(req, res){
    service.getFcm(req, res)
}
function gamenotifdecline(req, res) {
    service.gamenotifdecline(req, res)
}
function listorsentrequest(req, res) {
    service.listorsentrequest(req, res)
}
function canclerequest(req, res) {
    service.canclerequest(req, res)
}
function unfriend(req, res) {
    service.unfriend(req, res)
}
function userdetail(req, res) {
    service.userdetail(req, res)
}
function getuserpreference(req, res) {
    service.getuserpreference(req, res)
}
function friendnotification(req, res) {
    service.friendnotification(req, res)
}
function notificationCount(req, res) {
    service.notificationCount(req, res)
}
function removeNotificationCount(req, res) {
    service.removeNotificationCount(req, res)
}
function logout(req, res) {
    service.logout(req, res)
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
    getinvite,
    peoplenewtosquad,
    peopleimet,
    listforfriendrequest,
    sendrequest,
    requestlist,
    friendlist,
    acceptrequest,
    declinerequest,
    gamenotification,
    removegamenotification,
    gamenotifdecline,
    listorsentrequest,
    canclerequest,
    unfriend,
    userdetail,
    getuserpreference,
    friendnotification,
    getFcm,
    notificationCount,
    removeNotificationCount,
    logout
}