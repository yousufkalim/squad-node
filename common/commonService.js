const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const bcrypt = require('bcrypt');
const user = require('../schema/user')
const crypto = require('crypto');
const env = require('dotenv').config()

function uploadPhoto(req, res) {
    req.newFile_name = [];
    console.log("in upload photo", req.newFile_name)
    util.upload(req, res, async function (err) {
        if (err) {
            return res.json({ code: code.badRequest, message: err })
        }
        else {
            const files = req.files;
            let index, len;
            var filepathlist = []
            console.log("uploadPhoto ->  process.env.IMAGEPREFIX",  process.env.IMAGEPREFIX)
            for (index = 0, len = files.length; index < len; ++index) {
                // console.log("uploadPhoto -> files[index].path", files[index].path)
                let filepath = process.env.IMAGEPREFIX + files[index].path.slice(4,);;
                // console.log("uploadPhoto -> filepath", filepath)
                filepathlist.push(filepath)
            }
            return res.json({ code: code.created, message: msg.ok, data: filepathlist })
        }
    });
}


module.exports = {
    uploadPhoto 
}