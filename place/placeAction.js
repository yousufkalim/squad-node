const service = require('./placeService')


function addplace(req, res, next) {
    service.addplace(req, res, next)
}
function placelist(req, res, next) {
    service.placelist(req, res, next)
}

module.exports = {
    addplace,
    placelist
}