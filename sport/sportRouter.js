const sportRouter = require('express').Router();
const service = require('./sportService')
const validate = require('./sportValidator')
const actions = require('./sportAction')

sportRouter.route('/add')
    .post([validate.verifyToken], (req, res, next) => {
        actions.addsport(req, res, next)
    });

sportRouter.route('/list')
    .get([validate.verifyToken], (req, res, next) => {
        actions.listsport(req, res, next)
    });

// sportRouter.route('/userdetail')
//     .get([validate.verifyToken], (req, res, next) => {
//         actions.userdetail(req, res, next)
//     });

sportRouter.route('/update')
    .put([validate.verifyToken], (req, res, next) => {
        actions.updatesport(req, res, next)
    });
sportRouter.route('/deactive')
    .put([validate.verifyToken], (req, res, next) => {
        actions.deactivesport(req, res, next)
    });
sportRouter.route('/delete')
    .delete([validate.verifyToken], (req, res, next) => {
        actions.deletesport(req, res, next)
    });

module.exports = sportRouter;