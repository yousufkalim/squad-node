const userRouter = require('express').Router();
const service = require('./userService')
const validate = require('./userValidator')
const actions = require('./userAction')


userRouter.route('/register')
    .post([validate.validateSignUp], (req, res, next) => {
        actions.registerUser(req, res, next)
    });
userRouter.route('/login')
    .post([validate.validateLogin], (req, res, next) => {
        actions.loginUser(req, res, next)
    });
userRouter.route('/loginAdmin')
    .post([validate.validateLogin], (req, res, next) => {
        actions.loginAdmin(req, res, next)
    });
userRouter.route('/forgotPassword')
    .post([], (req, res) => {
        actions.forgotPassword(req, res)
    })
userRouter.route('/verifyToken')
    .get([], (req, res) => {
        actions.verifyToken(req, res)
    })
userRouter.route('/reset/:token')
    .get([], (req, res) => {
        actions.getresetpassword(req, res)
    })
userRouter.route('/reset/:token')
    .post([], (req, res) => {
        actions.resetpassword(req, res)
    })
userRouter.route('/validateemail/:id')
    .get([], (req, res) => {
        actions.getvalidateemail(req, res)
    })
userRouter.route('/validateemail/:id')
    .post([], (req, res) => {
        actions.validateemail(req, res)
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


userRouter.route('/createpreference')
    .post([validate.verifyToken], (req, res) => {
        actions.createpreference(req, res)
    })
userRouter.route('/getpreference')
    .get([validate.verifyToken], (req, res) => {
        actions.getpreference(req, res)
    })
userRouter.route('/updatepreference')
    .put([validate.verifyToken], (req, res) => {
        actions.updatepreference(req, res)
    })
userRouter.route('/removepreference')
    .put([validate.verifyToken], (req, res) => {
        actions.removepreference(req, res)
    })
userRouter.route('/test')
    .get([], (req, res) => {
        res.redirect('squad://reset/123')
    })


module.exports = userRouter;