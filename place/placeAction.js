const service = require('./placeService')


function addplace(req, res, next) {
    service.addplace(req, res, next)
}
function placelist(req, res, next) {
    service.placelist(req, res, next)
}
function addRating(req, res, next) {
    service.addRating(req, res, next)
}
function nearPlace(req, res, next) {
    service.nearPlace(req, res, next)
}

module.exports = {
    addplace,
    placelist,
    addRating,
    nearPlace
}