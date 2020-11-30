const service = require('./sportService')
// const userService=require('../user/userService')


function addsport(req, res, next) {
    service.addsport(req, res, next)
}

function listsport(req, res, next) {
    service.listsport(req, res, next)
}

// function userdetail(req, res,next) {
//     service.userdetail(req, res,next)
// }
function updatesport(req, res,next) {
    service.updatesport(req, res,next)
}
function deactivesport(req, res,next) {
    service.deactivesport(req, res,next)
}
function deletesport(req, res,next) {
    service.deletesport(req, res,next)
}
// function resetpassword(req, res,next) {
//     service.resetpassword(req, res,next)
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