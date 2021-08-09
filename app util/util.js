const jwt = require('jsonwebtoken')
const generator = require('generate-password')
const nodemailer = require('nodemailer')



var fs = require('fs')
var path = require('path')
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './img');
    },
    filename: function (req, file, callback) {
        let file_name = file.fieldname + '-' + Date.now() + path.extname(file.originalname)
        req.newFile_name.push(file_name);
        callback(null, file_name);
    }
});
var upload = multer({
    storage: storage,
    fileFilter: function (req, file, callback) {
        checkFileType(file, callback)
    }

}).array('img', 5);
function validateEmail(data) {
    let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(data)
}

function validatePassword(data) {
    // let regex = /^(?=.*[A-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{6,16}$/; ///^(?=.*[A-z])(?=.*[0-9])(?=.*[@#$_-])\S{8,20}$/;
    // return regex.test(data)

    password = data

    var error = 'password shoud contain'

      // Minimum 8 characters
      if (password.length < 6) {
        error += ' atlist 6 characters minimum'
      }

      // At least one uppercase
      // if (/[A-Z]/.test(password)) {
      // }

      // At least one lowercase
      if (!(/[a-z]/.test(password))) {
        if (error === "password shoud contain") {
          error += " character";
        } else {
          error += ", character";
        }
      }

      // At least one number
      if (!/[0-9]/.test(password)) {
        if (error === "password shoud contain") {
          error += " numaric value";
        } else {
          error += ", numaric value";
        }
      }

      // At least one symbol
      if (!(/[$@$!%*#?&]/.test(password))) {
        if (error === "password shoud contain") {
          error += " 1 special character";
        } else {
          error += ", 1 special character";
        }
      }

    //   noerror = false
      if(error === 'password shoud contain'){
        error = true
      } else if(error === 'password shoud contain numaric value, 1 special character'){
        error = 'password shoud contain numaric value and 1 special character'
      } else if(error === 'password shoud contain atlist 6 characters minimum, 1 special character'){
        error = 'password shoud contain atlist 6 characters minimum and 1 special character'
      } else if(error === 'password shoud contain atlist 6 characters minimum, numaric value, 1 special character') {
        error = 'password shoud contain atlist 6 characters minimum, numaric value and 1 special character'
      } else if(error === 'password shoud contain atlist 6 characters minimum, numaric value'){
        error = 'password shoud contain atlist 6 characters minimum and numaric value'
      } else if(error === 'password shoud contain atlist 6 characters minimum, character, numaric value, 1 special character'){
        error = 'password shoud contain atlist 6 characters minimum, character, numaric value and 1 special character'
      } else if(error === 'password shoud contain atlist 6 characters minimum, character'){
        error = 'password shoud contain atlist 6 characters minimum and character'
      } else if(error === 'password shoud contain atlist 6 characters minimum, character, numaric value'){
        error = 'password shoud contain atlist 6 characters minimum, character and numaric value'
      } else if(error === "password shoud contain atlist 6 characters minimum, character, 1 special character"){
        error = "password shoud contain atlist 6 characters minimum, character and 1 special character"
      } else if(error === "password shoud contain character, 1 special character"){
        error = "password shoud contain character and 1 special character"
      }

      return  error
}

function generateToken(data, secret) {
    // console.log("generateToken -> data=========================>", data)
    let obj = {
        id: data._id,
        email: data.email,
        role:data.role,
        nursery:data.nursery
    }
    return jwt.sign(obj, secret, { expiresIn: '720hr' })
}
async function sendEMail(receiverid, data) {
    // console.log("sendEMail ->  process.env.MAIL_SERVICE",  process.env.MAIL_SERVICE,process.env.USERID,process.env.PASSWORD)
    var tansporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        auth: {
            user: process.env.USERID,
            pass: process.env.PASSWORD
        }
    })


    var mailoption = {

        from: `<${process.env.USERID}>`,
        to: receiverid,
        subject: data.subject,
        // text: 'That was easy!'
        html: data.html

    }
    return new Promise(function (resolve, reject) {
        tansporter.sendMail(mailoption, (err) => {
            (err) ? reject(err) : resolve(true)
        })
    })

}
function generateRandomPassword() {
    return generator.generate({
        length: 10,
        numbers: true
    })
}

function decodeToken(token) {
    return jwt.decode(token)
}
function checkFileType(file, callback) {
    const fileTypes = /jpeg|jpg|png|gif|svg/;
    const extName = fileTypes.test(path.extname(file.originalname).toLocaleLowerCase());
    if (extName) {
        return callback(null, true);
    }
    else {
        callback('Error:Images only!')
    }
}
var verifyAdminToken = async function (jwtToken) {
    try {
        let payload = await jwt.verify(jwtToken, process.env.ADMIN_SECRET);
        return payload
    } catch (e) {

        return res.json({ code: CODE.BADREQUEST, message:MSG.internalServerError })
    }
};

module.exports = {
    validateEmail,
    validatePassword,
    generateToken,
    sendEMail,
    generateRandomPassword,
    decodeToken,
    upload,
    checkFileType,
    verifyAdminToken
}