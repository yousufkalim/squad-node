const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const userdao = require('../user/userDao');
const sportdao=require('../sport/sportDao')
const bcrypt = require('bcrypt');
const sport = require('../schema/sport')
const user = require('../schema/user')
const crypto = require('crypto');
const { role } = require('../constants');
const env = require('dotenv').config()
const event = require('../schema/event');
const crg = require('country-reverse-geocoding').country_reverse_geocoding();



function listuser(req, res) {
    let query = { role: role.user }
    userdao.find(query).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function listsport(req, res) {
    // let query = { role: role.user }
    sportdao.find().then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function userdetail(req, res) {
    let query = { _id: req.query.userId }
    userdao.findone(query).then((data) => {
        let response = {
            active: data.active,
            _id: data._id,
            name: data.name,
            email: data.email,
            contactNo: data.contactNo,
            imageUrl: data.imageUrl
        }

        return res.json({ code: code.ok, data: response })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function updateuser(req, res) {
    let query = { _id: req.query.userId },
        update = { $set: req.body },
        options = { new: true }
        console.log(update)
    userdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function deactiveuser(req, res) {
    let query = { _id: req.query.userId },
        update = { $set: { active: req.body.active } },
        options = { new: true }
    userdao.findOneAndUpdate(query, update, options).then((data) => {
        return res.json({ code: code.ok, data: data })
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function deleteuser(req, res) {
    let query = { _id: req.query.userId }

    userdao.remove(query).then((data) => {
        // console.log("deleteuser -> data", data)
        if (data.deletedCount == 1) {
            return res.json({ code: code.ok, messages: msg.userdeleted })
        }else{
            return res.json({code:code.notFound,messages:msg.notFound})
        }
    }).catch((err) => {
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
function resetpassword(req, res) {
    const newpass = util.generateRandomPassword().toUpperCase()
    const hash = bcrypt.hashSync(newpass, bcrypt.genSaltSync(10))
    let query = { _id: req.query.userId },
        update = { $set: { password: hash } },
        options = { new: true }
    return userdao.findOneAndUpdate(query, update, options).then(async (result) => {
        let obj = {
            username: result.name,
            subject: "New Password",
            html: `Hi ${result.name} <br /> 
            // Your password has been reset here is your new password ${newpass}<br /> <br />Best Regards, <br />Squad XYZ Team `
        }
        await util.sendEMail(result.email, obj).then(async (result) => {
            (result == true) ? res.json({ code: code.ok, message: msg.passwordreset })
                : res.json({ code: code.ok, message: msg.mailnotsend })
        })
        // res.json({ code: code.ok, message: msg.passwordreset })
    }).catch((err) => {
        // console.log("createUser -> err", err)
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

function playerLocations(req, res) {
    user.find().select({_id: 1, location: 1, firstname: 1, lastname: 1, contactNo: 1, gender: 1, dob: 1}).then(async (data) => {
        var kk = []
        for(let i = 0; i < data.length; i++){
            if(!data[i].firstname){
                data[i].firstname = ''
            }
            if(!data[i].lastname){
                data[i].lastname = ''
            }
            if(!data[i].contactNo){
                data[i].contactNo = ''
            }
            if(!data[i].gender){
                data[i].gender = ''
            }
            if(!data[i].dob){
                data[i].dob = ''
            }
            const cc = await crg.get_country(data[i].location.coordinates[1], data[i].location.coordinates[0])
            let d = {
                ...data[i]._doc,
                country: cc ? cc.name : ''
            }
            kk.push(d)
        }

        kk.forEach(function(v){ delete v.location });
        return res.json({ code: code.ok, data: kk })
    }).catch((err) => {
        console.log(err)
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}

function playerRating(req, res){
    userdao.find().then(async(data) => {
        var ss = []
        for(let i = 0; i < data.length; i++){
            rates = (data[i].rateasplayer) ? data[i].rateasplayer : [];
            Array.prototype.push.apply(rates, data.rateasorganizer);
            let avgrage = 0;
            await rates.forEach(element => {
                avgrage += element.ratedwith;
            });

            if(!data[i].contactNo){
                data[i].contactNo = ''
            }
            if(!data[i].firstname){
                data[i].firstname = ''
            }
            if(!data[i].lastname){
                data[i].lastname = ''
            }
            var ll = {
                firstname: data[i].firstname,
                lastname: data[i].lastname,
                contactNo: data[i].contactNo,
                rating: avgrage
            }
            ss.push(ll)
            console.log("getprofile -> avgrate", avgrage)
        }
        
        return res.send(ss)
    }).catch((error) => {
        console.log(error)
    })
}

function eventHours(req, res) {
    var query = {}

    if (req.query.date) {
        var start = new Date(req.query.date + "T00:00:00.000Z")
        var end = new Date(req.query.date + "T23:59:59.000Z")
    } else {
        var start = new Date("2000-01-01T00:00:00.000Z")
        var end = new Date()
    }

    if(req.query.longitude && req.query.lattitude){
        query = {
            "location.coordinates": { $in: [req.query.longitude, req.query.lattitude] },
            'date': { $gte: start, $lt: end }
        }
    } else {
        query = {
            'date': { $gte: start, $lt: end }
        }
    }
    
    event.find(query).then((data) => {
        var myData = []
        let timeDiff = 0
        for (let i = 0; i < data.length; i++) {
            timeDiff += (data[i].endtime - data[i].starttime) / 1000 / 3600;
        }
        var forData = {
            totalEvents: data.length,
            totalTimeHour: timeDiff
        }
        return res.json(forData)
    }).catch((err) => {
        console.log(err)
    })
}

function sportLocations(req, res) {
    event.find().select({ _id: 1, location: 1, address: 1, participants: 1, sport: 1 }).populate('sport', 'name').then(async (data) => {
        sport.find().select({status: 0, image: 0, __v: 0}).then(async(sportData) => {
          

            const ddd = []
            for (let j = 0; j < sportData.length; j++) {
                var kk = []
                for (let i = 0; i < data.length; i++) {
                    const cc = await crg.get_country(data[i].location.coordinates[1], data[i].location.coordinates[0])
                    
                    if (data[i].sport.name == sportData[j].name.toString()) {
                        let d = {
                            ...data[i]._doc,
                            sport: data[i].sport.name,
                            country: cc ? cc.name : ''
                        }
                        kk.push(d)
                    }
                }
                kk.forEach(function (v) { delete v.location });
                var define = {
                    ...sportData[j]._doc,
                    events: kk
                }
                ddd.push(define)
            }

            const lll = []
            for (let x = 0; x < ddd.length; x++) {
                const aaa = []
                for (let y = 0; y < ddd[x].events.length; y++) {
                    var commonCountry = []
                    var countId = 0
                    for (let z = 0; z < ddd[x].events.length; z++) {
                        
                        if(ddd[x].events[y].country === ddd[x].events[z].country){
                            countId += ddd[x].events[z].participants.length
                            // var form = {
                            //     people: countId,
                            //     _id: ddd[x].events[z]._id,
                            //     country: ddd[x].events[z].country
                            // }
                            commonCountry.push(countId)
                        }
                    }
                    aaa.push({
                        country: ddd[x].events[y].country,
                        data: commonCountry[commonCountry.length - 1]
                    })
                }
                // console.log(aaa)
                medios = aaa.reduce((c, n) =>
                    c.find(el => el.country == n.country) ? c : [...c, n], [])
                lll.push({
                    _id: ddd[x]._id,
                    name: ddd[x].name,
                    country: medios
                })
            }

            return res.json({ code: code.ok, data: lll })
        }).catch((Err) => {
            console.log(err)
            return res.json({ code: code.ineternalError, messages: msg.internalServerError })
        })
    }).catch((err) => {
        console.log(err)
        return res.json({ code: code.ineternalError, messages: msg.internalServerError })
    })
}
module.exports = {
    listuser,
    userdetail,
    updateuser,
    deactiveuser,
    deleteuser,
    resetpassword,
    listsport,
    playerLocations,
    playerRating,
    eventHours,
    sportLocations
}