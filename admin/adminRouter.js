const adminRouter = require('express').Router();
const service = require('./adminService')
const validate = require('./adminValidator')
const actions = require('./adminAction')


adminRouter.route('/listuser')
    .get([validate.verifyToken], (req, res, next) => {
        actions.listuser(req, res, next)
    });
    adminRouter.route('/listsport')
    .get([validate.verifyToken], (req, res, next) => {
        actions.listsport(req, res, next)
    })
adminRouter.route('/userdetail')
    .get([validate.verifyToken], (req, res, next) => {
        actions.userdetail(req, res, next)
    });

adminRouter.route('/updateuser')
    .put([validate.verifyToken, validate.validateupdate], (req, res, next) => {
        actions.updateuser(req, res, next)
    });
adminRouter.route('/deactiveuser')
    .put([validate.verifyToken], (req, res, next) => {
        actions.deactiveuser(req, res, next)
    });
adminRouter.route('/deleteuser')
    .delete([validate.verifyToken], (req, res, next) => {
        actions.deleteuser(req, res, next)
    });
adminRouter.route('/resetpassword')
    .put([validate.verifyToken], (req, res, next) => {
        actions.resetpassword(req, res, next)
    });

module.exports = adminRouter;