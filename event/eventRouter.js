const eventRouter = require('express').Router();
const service = require('./eventService')
const validate = require('./eventValidator')
const actions = require('./eventAction')



eventRouter.route('/add')
    .post([validate.verifyToken], (req, res, next) => {
        actions.addevent(req, res, next)
    });
eventRouter.route('/detail')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventdetail(req, res, next)
    });
eventRouter.route('/list')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventlist(req, res, next)//filter by date
    });
eventRouter.route('/myevents')
    .get([validate.verifyToken], (req, res, next) => {
        actions.myevents(req, res, next)//created by user
    });
eventRouter.route('/joinevent')
    .post([validate.verifyToken], (req, res, next) => {
        actions.joinevent(req, res, next)
    });
eventRouter.route('/eventplayed')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventplayed(req, res, next)
    });
eventRouter.route('/eventwillplayed')
    .get([validate.verifyToken], (req, res, next) => {
        actions.eventwillplayed(req, res, next)
    });
// eventwillplayed
module.exports = eventRouter;