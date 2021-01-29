const sportRouter = require('express').Router();
const service = require('./sportService')
const validate = require('./sportValidator')
const actions = require('./sportAction')

sportRouter.route('/add')
    .post([validate.verifyAdminToken], (req, res, next) => {
        actions.addsport(req, res, next)
    });
sportRouter.route('/listunauthorized')
    .get([], (req, res, next) => {
        actions.listsport(req, res, next)
    });
sportRouter.route('/list')
    .get([validate.verifyToken], (req, res, next) => {
        actions.listsport(req, res, next)
    });

sportRouter.route('/update')
    .put([validate.verifyAdminToken], (req, res, next) => {
        actions.updatesport(req, res, next)
    });
sportRouter.route('/deactive')
    .put([validate.verifyAdminToken], (req, res, next) => {
        actions.deactivesport(req, res, next)
    });
sportRouter.route('/delete')
    .delete([validate.verifyAdminToken], (req, res, next) => {
        actions.deletesport(req, res, next)
    });

module.exports = sportRouter;