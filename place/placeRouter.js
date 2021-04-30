const placeRouter = require('express').Router();
const service = require('./placeService')
const validate = require('./placeValidator')
const actions = require('./placeAction')


placeRouter.route('/add')
    .post(
        [
            // validate.verifyAdminToken
        ]
        , (req, res, next) => {
        actions.addplace(req, res, next)
    });
placeRouter.route('/list')
    .get([validate.verifyToken], (req, res, next) => {
        actions.placelist(req, res, next)
    });
placeRouter.route('/add/rating')
    .post([validate.verifyToken], (req, res, next) => {
        actions.addRating(req, res, next)
    });
placeRouter.route('/nearPlace')
    .get([validate.verifyToken], (req, res, next) => {
        actions.nearPlace(req, res, next)
    });

module.exports = placeRouter;