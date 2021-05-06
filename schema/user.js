
const schmaName = require('../constants').schemas;
const mongoose = require('mongoose');
const schema = mongoose.Schema;
const schemaName = require('../constants').schemas;
const role = require('../constants/index').role;
const bcrypt = require('bcrypt');
const level = require('../constants/index').level;
const gender = require('../constants/index').gender;
const rateas = require('../constants/index').rateas;
var userSchema = new schema({
    firstname: { type: String },
    lastname: { type: String },
    dob: { type: Date },
    email: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: [Number] // [  ,<longitude>, <latitude> ]
    },
    emailvalidate: { type: Boolean, default: false },
    password: { type: String },
    contactNo: { type: String },
    imageUrl: { type: String },
    isSocialLogin: { type: Boolean, default: false },
    gender: { type: String, enum: [gender.male, gender.female, gender.other] },
    socialId: { type: String },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    role: { type: String, enum: [role.admin, role.user], default: role.user },
    isdeleted: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    preferences: [{
        sportId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.sport },
        radius: { type: Number },
        level: { type: String, enum: [level.beginner, level.intermediate, level.advanced] }
    }],
    fcmToken: { type: String },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: schmaName.user }],
    friendRequest: [{ type: mongoose.Schema.Types.ObjectId, ref: schmaName.user }],
    sentRequest: [{ type: mongoose.Schema.Types.ObjectId, ref: schmaName.user }],
    rateasplayer: [{
        ratedwith: { type: Number, min: 0, max: 5 },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        by: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.user },
    }],
    rateasorganizer: [{
        ratedwith: { type: Number, min: 0, max: 5 },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        by: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.user },
    }],
    participatedin: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event }
    }],
    //=========================notification================================//
    invitationtogame: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.user },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        createdAt: { type: Date, default: Date.now() }
    }],//notification for game invitation
    rateyouNotification: [{
        type: { type: String, enum: [rateas.beginner, rateas.intermediate] },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.user },
        createdAt: { type: Date, default: Date.now() }
    }],
    joineventNotification: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.user },
        createdAt: { type: Date, default: Date.now() }
    }],
    friendrequestNotification: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.user },
        createdAt: { type: Date, default: Date.now() }
    }],
    eventhappenNotification: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        createdAt: { type: Date, default: Date.now() }
    }],
    eventafterhourNotification: [{
        hours: { type: Number },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        createdAt: { type: Date, default: Date.now() }
    }],
    rateplayerNotification: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        createdAt: { type: Date, default: Date.now() }
    }],
    rateallNotification: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        createdAt: { type: Date, default: Date.now() }
    }],
    eventfullNotification: [{
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: schmaName.event },
        createdAt: { type: Date, default: Date.now() }
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
                // console.log("data but no admin")
                addAdmin()
            }
            else {
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
        "role": "ADMIN",
        "location": {
            // type: { type: String, default: 'Point' },
            "coordinates": [process.env.LONG, process.env.LAT] // [  ,<longitude>, <latitude> ]
        },
    };
    // console.log("addAdmin -> obj", obj)

    let updatedPass = await bcrypt.hashSync(obj.password, bcrypt.genSaltSync(10));
    obj.password = updatedPass;
    let admin = new Users(obj);
    admin.save(function (err, result) {
        (err) ? console.log(err) : console.log('admin created successfully.')
    })
}