const util = require('../app util/util');
const code = require('../constants').http_codes;
const msg = require('../constants').messages;
const status = require('../constants').status;
const placedao = require('./placeDao');
const eventdao = require('../event/eventDao');
const user = require('../schema/user');
const geolib = require('geolib');


function latlongtokm(userlong, userlat, eventlong, eventlang) {
    let km = geolib.getDistance(
        { latitude: userlong, longitude: userlat },
        { latitude: eventlong, longitude: eventlang }
    );
    return km
}


function addplace(req, res) {
    const data = req.body
    const { sportId, location } = req.body;
    let query = {
        $and: [{
            'sport': sportId
        },
        {
            'placeId': null
        },
        ]
    }
    return placedao.create(data).then((data) => {
        eventdao.find(query).then((eventdata) => {
            var eventIds = []
            eventdata.map((eve, eindex) => {
                if (eve.location.coordinates[0].toFixed(4) == location.coordinates[0].toFixed(4) &&
                    eve.location.coordinates[1].toFixed(4) == location.coordinates[1].toFixed(4)) {
                    eventIds.push(eve._id)
                }
                if (eventdata.length == (eindex + 1)) {
                    //function for update placeId in particular event
                    addplaceevent(eventIds, data._id)
                    console.log("addplace -> eventIds", eventIds)
                }
            })
        })
        res.json({ code: code.created, message: msg.placeadded })
    }).catch((err) => {
        res.json({ code: code.ineternalError, message: msg.internalServerError })
    })
}

function placelist(req, res) {
    let token = req.headers['authorization']
    let userToken = util.decodeToken(token)
    user.findById(userToken.id).then((userdata) => {

        var query = {}

        if(req.query.sportId){
            query.sportId = {$in : [req.query.sportId, '6013faa12944c45b089af469']}
        }
        return placedao.find(query).then((data) => {

            var mydata = []
            for(var i = 0; i < data.length; i++){
                let nearToplace = {
                    ...data[i]._doc,
                    distance: latlongtokm(userdata.location.coordinates[0], userdata.location.coordinates[1],
                        data[i].location.coordinates[0], data[i].location.coordinates[1])
                }
                mydata.push(nearToplace)
            }

            mydata.sort(function(a, b) {
                return a.distance - b.distance;
              });
            res.json({ code: code.ok, data: mydata })

        }).catch((err) => {
            console.log("placelist -> err", err)
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })
    })
}

function addRating(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)
    const { rate, placeId } = req.body;
    let rating = {
        by: obj.id,
        ratedwith: rate
    }
    let query = { _id: placeId },
        update = { $push: { "rates": rating } },
        options = { new: true };
    placedao.findOneAndUpdate(query, update, options).then((userdata) => {
        (userdata.fcmToken) ? rateyounotification(userdata.fcmToken) : '';
        return res.json({ code: code.ok, msg: msg.addrate })
    }).catch((err) => {
        console.log("addRating -> err", err)
        return res.json({ code: code.internalError, message: msg.internalServerError })
    })

}

function nearPlace(req, res) {
    let token = req.headers['authorization'],
        obj = util.decodeToken(token)

        let places = [{
            "id": 1,
            "sport": 'Multipurpose',
            "venue": 'DSC Multi-Purpose Stadium (u/c)',
            "address": 'Dubai Sports City - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.043304',
                'long': '55.224581',
            }
        },{
            "id": 2,
            "sport": 'Multipurpose',
            "venue": 'Al-Maktoum Stadium',
            "address": 'Oud Metha - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.239921052916493',
                'long': '55.31280909999998',
            }
        },{
            "id": 3,
            "sport": 'Multipurpose',
            "venue": 'IthihadAl، Al Etihad Road - United Arab Emirates',
            "address": 'IthihadAl، Al Etihad Road - United Arab Emirates',
            'geoLocation': {
                'lat': '25.279703803122043',
                'long': '55.360565550000004',
            }
        },{
            "id": 4,
            "sport": 'Multipurpose',
            "venue": 'Maktoum bin Rashid Al Maktoum Stadium',
            "address": 'Deira - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.29081425350623',
                'long': '55.34815410000001',
            }
        },{
            "id": 5,
            "sport": 'Multipurpose',
            "venue": 'Zabeel Stadium',
            "address": 'Unnamed Road - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.218900000000012',
                'long': '55.31714722222198',
            }
        },{
            "id": 6,
            "sport": 'Multipurpose',
            "venue": 'DSC Indoor Arena',
            "address": 'Dubai Sports City - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.045287',
                'long': '55.22368',
            }
        },{
            "id": 7,
            "sport": 'Multipurpose',
            "venue": 'Dubai International Stadium',
            "address": 'Dubai Sports City, Nr - Dubai - Émirats arabes unis',
            'geoLocation': {
                'lat': '25°2′48″N',
                'long': '55°13′8″E',
            }
        },{
            "id": 8,
            "sport": 'Multipurpose',
            "venue": 'Hamdan Sports Complex',
            "address": 'Exit 611, Opp. Global Village - Emirates Rd - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.0512548',
                'long': '55.3180397',
            }
        },{
            "id": 9,
            "sport": 'Multipurpose',
            "venue": 'Prime Star - Badminton - Al Nasr Club -  Oud Metha',
            "address": 'Oud Metha - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.241231861924543',
                'long': '55.31107874582207',
            }
        },{
            "id": 10,
            "sport": 'Multipurpose',
            "venue": 'Al Nasr Badminton Court',
            "address": '10th St - Oud Metha - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.24225606034092',
                'long': '55.30595933503955',
            }
        },{
            "id": 11,
            "sport": 'Multipurpose',
            "venue": 'SIMBR Sports -Tennis, basketball, badminton, volleyball court in Qusais',
            "address": '13 - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.281209370137834',
                'long': '55.36758086422293',
            }
        },{
            "id": 12,
            "sport": 'Multipurpose',
            "venue": 'Dubai Sports World',
            "address": 'Arena - Sheikh Zayed Road Dubai World - Trade Centre - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '',
                'long': '',
            }
        },{
            "id": 13,
            "sport": 'Hockey',
            "venue": 'DSC Hockey Stadium',
            "address": 'Jebel Ali Village - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.021708',
                'long': '55.132985',
            }
        },{
            "id": 14,
            "sport": 'Tennis',
            "venue": 'Dubai Tennis Stadium',
            "address": 'Century Village - 31 A St - Garhoud - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.2423730039445',
                'long': '55.34214019999998',
            }
        },{
            "id": 15,
            "sport": 'Tennis',
            "venue": 'Tennis 360',
            "address": 'Trade CentreTrade Centre 2 - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.025735150145177',
                'long': '55.20246673444191',
            }
        },{
            "id": 16,
            "sport": 'Tennis',
            "venue": 'BTME Beach Tennis Club',
            "address": 'The Beach JBR، Beach Walk - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.07715180065092',
                'long': '55.130806560983665',
            }
        },{
            "id": 17,
            "sport": 'Tennis',
            "venue": 'Padel Pro UAE',
            "address": 'Garn Al Sabkha St - Jumeirah Park - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.055258811761934',
                'long': '55.13877478837636',
            }
        },{
            "id": 18,
            "sport": 'Basketball',
            "venue": 'Basketball Hub Dubai',
            "address": '5 15 A St, Umm SuqeimJumeirah 3 - Dubai - Émirats arabes unis',
            'geoLocation': {
                'lat': '25.145464310184007',
                'long': '55.22489714564482',
            }
        },{
            "id": 19,
            "sport": 'Basketball',
            "venue": 'Dubai Sports City Football Academy',
            "address": 'Off - إ311 - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '',
                'long': '',
            }
        },{
            "id": 20,
            "sport": 'Cricket',
            "venue": 'The Sevens Stadium',
            "address": `XFW8+2H 'Ud al Bayda', Dubai - United Arab Emirates`,
            'geoLocation': {
                'lat': `24°59'42.0"N`,
                'long': `55°27'59.0"E`,
            }
        },{
            "id": 21,
            "sport": 'Cricket',
            "venue": 'International Cricket Council',
            "address": 'Sheikh Zayed Rd - Al SufouhAl Sufouh 2 - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.04445955335866',
                'long': '55.22645858743014',
            }
        },{
            "id": 22,
            "sport": 'Footbal',
            "venue": 'Dubai Sports City Football Academy',
            "address": 'Off - إ311 - Dubai - United Arab Emirates',
            'geoLocation': {
                'lat': '25.038258887010652',
                'long': '55.226088147381304',
            }
        }]

        return res.json({code: code.ok, data: places})

}

function addplaceevent(events, placeid) {

    events.map((eve) => {
        let query = {
            _id: eve
        },
            update = { $set: { placeId: placeid } },
            options = { new: true };
        eventdao.findOneAndUpdate(query, update, options).then((data) => {
            console.log("addplaceevent -> data", data)

        }).catch((err) => {
            res.json({ code: code.ineternalError, message: msg.internalServerError })
        })

    })
}
module.exports = {
    latlongtokm,
    addplace,
    placelist,
    addRating,
    addplaceevent,
    nearPlace
}