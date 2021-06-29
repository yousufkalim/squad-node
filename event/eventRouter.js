const eventRouter = require('express').Router();
const service = require('./eventService')
const validate = require('./eventValidator')
const actions = require('./eventAction')

eventRouter.route('/addunauthorized')
    .post([], (req, res, next) => {
        actions.addeventunauthorized(req, res, next)
    });

eventRouter.route('/add')
    .post([validate.verifyToken], (req, res, next) => {
        actions.addevent(req, res, next)
    });
eventRouter.route('/update')
    .put([validate.verifyToken], (req, res, next) => {
        actions.updateevent(req, res, next)
    });
eventRouter.route('/detail')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventdetail(req, res, next)
    });
eventRouter.route('/list')
    .post([validate.verifyToken], (req, res, next) => {
        actions.eventlist(req, res, next)//filter by date
    });
eventRouter.route('/delete')
    .delete([validate.verifyToken], (req, res, next) => {
        actions.deleteevent(req, res, next)
    });
eventRouter.route('/myevents')
    .get([validate.verifyToken], (req, res, next) => {
        actions.myevents(req, res, next)//created by user
    });
eventRouter.route('/joinevent')
    .post([validate.verifyToken], (req, res, next) => {
        actions.joinevent(req, res, next)
    });
eventRouter.route('/unjoinevent')
    .post([validate.verifyToken], (req, res, next) => {
        actions.unjoinevent(req, res, next)
    });
eventRouter.route('/eventplayed')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventplayed(req, res, next)
    });
eventRouter.route('/eventwillplay')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventwillplayed(req, res, next)
    });
eventRouter.route('/preferencebasedlist')
    .get([validate.verifyToken], (req, res, next) => {
        actions.preferenceBasedList(req, res, next)
    });
// eventwillplayed


eventRouter.route('/invitation')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventinvitation(req, res, next)
    });

eventRouter.route('/eventFCM')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventFCM(req, res, next)
    });





module.exports = eventRouter;