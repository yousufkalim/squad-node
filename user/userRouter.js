const userRouter = require('express').Router();
// const service = require('./userService')
const validate = require('./userValidator')
const actions = require('./userAction')


userRouter.route('/register')
    .post([], (req, res, next) => {
        actions.registerUser(req, res, next)
    });
userRouter.route('/login')
    .post([validate.validateLogin], (req, res, next) => {
        actions.loginUser(req, res, next)
    });
userRouter.route('/forgotPassword')
    .post([], (req, res) => {
        actions.forgotPassword(req, res)
    })

userRouter.route('/reset/:token')
    .get([], (req, res) => {
        actions.getresetpassword(req, res)
    })
userRouter.route('/reset/:token')
    .post([], (req, res) => {
        actions.resetpassword(req, res)
    })
// commonRouter.route('/uploadPhoto')
//     .post([], (req, res) => {
//         service.uploadPhoto(req, res)
//     })
module.exports = userRouter;