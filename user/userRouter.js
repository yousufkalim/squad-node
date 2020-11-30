const userRouter = require('express').Router();
const service = require('./userService')
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
userRouter.route('/getprofile')
    .get([validate.verifyToken], (req, res) => {
        actions.getprofile(req, res)
    })
userRouter.route('/update')
    .put([validate.verifyToken], (req, res) => {
        actions.update(req, res)
    })
userRouter.route('/sportlist')
    .get([validate.verifyToken], (req, res) => {
        actions.sportlist(req, res)
    })

userRouter.route('/gmail/socialLogin')
    .post([validate.validateSocialLogin], (req, res) => {
        actions.socialloginGmail(req, res)
    })
userRouter.route('/facebook/socialLogin')
    .post([validate.validateSocialLoginFace], (req, res) => {
        actions.socialloginFacebook(req, res)
    })
userRouter.route('/linkedin/socialLogin')
    .post([validate.validateSocialLoginLinkedin], (req, res) => {
        actions.socialloginLinkedin(req, res)
    })

module.exports = userRouter;