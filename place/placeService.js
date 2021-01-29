const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const placedao = require('./placeDao');

function addplace(req, res) {
    const data = req.body
    return placedao.create(data).then((data) => {
        res.json({ code: code.created, message: msg.placeadded })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}
function placelist(req, res) {
    let query = { sportId: req.query.sportId }
    return placedao.find(query).then((data) => {
        res.json({ code: code.ok, data: data })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}


module.exports = {
    addplace,
    placelist

}