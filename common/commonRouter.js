const commonRouter = require('express').Router();
const service = require('./commonService')
const validate = require('./commonValidator')
const actions = require('./commonAction')


commonRouter.route('/register')
    .post([validate.validateBody], (req, res, next) => {
        actions.registerUser(req, res, next)
    });
commonRouter.route('/update')
    .put([validate.verifyToken, validate.validateUpdate], (req, res, next) => {
        actions.updateProfile(req, res, next)
    });

commonRouter.route('/login')
    .post([validate.validateLogin], (req, res, next) => {
        actions.loginUser(req, res, next)
    });

commonRouter.route('/uploadPhoto')
    .post([], (req, res) => {
        service.uploadPhoto(req, res)
    })
commonRouter.route('/forgotPassword')
    .post([], (req, res) => {
        actions.forgotPassword(req, res)
    })
commonRouter.route('/reset/:token')
    .get([], (req, res) => {
        actions.getresetpassword(req, res)
    })
commonRouter.route('/reset/:token')
    .post([], (req, res) => {
        actions.resetpassword(req, res)
    })
module.exports = commonRouter;