//for directors and teachers
const schmaName = require('../constants').schemas;
const mongoose = require('mongoose');
const schema = mongoose.Schema;
const schemaName = require('../constants').schemas;
const role = require('../constants/index').role;
const bcrypt = require('bcrypt');
const level=require('../constants/index').level;
var userSchema = new schema({
    firstname: { type: String },
    lastname: { type: String },
    dob:{type:Date},
    email: { type: String },
    password: { type: String },
    contactNo: { type: String },
    imageUrl: { type: String },
    isSocialLogin: { type: Boolean, default: false },
    socialId: { type: String },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    role: { type: String, enum: [role.admin, role.user] },
    isdeleted: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    preferences:[{
        sportId:{type: mongoose.Schema.Types.ObjectId, ref: schmaName.sport},
        radius:{type: String},
        level:{type:String,enum:[level.beginner,level.intermediate,level.advanced]}
    }]

});

Users = module.exports = mongoose.model(schemaName.user, userSchema)

Users.countDocuments().then((data) => {
    if (data == 0) {
        console.log("no data")
        addAdmin()
    }
    else {
        Users.findOne({ role: "ADMIN" }).then((result) => {
            if (result == null) {
                console.log("data but no admin")
                addAdmin()
            }
            else{
                console.log("There is already admin")
            }
        })
    }
}).catch((err) => {
    console.error({ err })
})
async function addAdmin() {
    let obj = {
        "email": process.env.ADMIN_EMAIL,
        "password": process.env.ADMIN_PASSWORD,
        "role": "ADMIN"
    };
    console.log("addAdmin -> obj", obj)

    let updatedPass = await bcrypt.hashSync(obj.password, bcrypt.genSaltSync(10));
    obj.password = updatedPass;
    let admin = new Users(obj);
    admin.save(function (err, result) {
        (err) ? console.log(err) : console.log('admin created successfully.')
    })
}