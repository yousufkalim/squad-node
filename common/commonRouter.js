const commonRouter = require('express').Router();
const service = require('./commonService')
const validate = require('./commonValidator')
const actions = require('./commonAction')


commonRouter.route('/uploadPhoto')
    .post([], (req, res) => {
        service.uploadPhoto(req, res)
    })

module.exports = commonRouter;