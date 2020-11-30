var express = require('express')
var app = express();
var http = require('http').Server(app);
var roomSchema = require('../schema/room')
var messageSchema = require('../schema/chat');
// const room = require('../schema/room');
const { status } = require('../constants/index')
// const { accountType } = require('../constants/index')

const { populate } = require('../schema/room');
const { isValidObjectId } = require('mongoose');
const { unique } = require('jquery');
module.exports = function (io) {
	users = new Map();

	var connectedUser = []
	io.on('connection', function (socket) {
    console.log("=======================================in socket===============================================")
		users.set(JSON.stringify(socket.handshake.query.loggeduser), socket.id)
		console.log("socket.id", socket.id)
		var id = socket.id;

		socket.on('roomCreate', function (obj) {
        console.log("========================================roomCreate=======================================")
			var data = [];
			data.push(obj.senderId)
			data.push(obj.receiverId)

			roomSchema.findOne({ participants: { $all: data } }, (err, roomData) => {
				if (err) {
					console.log(err)
				}
				else if (!roomData) {
					var newRoom = new roomSchema({ participants: data })
					newRoom.save(function (error, data) {
						if (error) {
							console.log("error", error)
						}
						else {
                            console.log("roomResponse")
							socket.emit('roomResponse', data)

						}
					})
				} else {
					console.log("roomResponse")
					socket.emit('roomResponse', roomData)

				}
			})

		})

		// socket.on('chatData', function (data) {
		// 	if (data.isBlocked == true) {
		// 		let query = {
		// 			"senderId": { $in: [data.senderId, data.receiverId] },
		// 			"receiverId": { $in: [data.senderId, data.receiverId] },
		// 		};
		// 		messageSchema.find(query).sort({ $natural: -1 }).limit(1).then(async (result) => {
		// 			let query = { _id: result[0]._id },
		// 				update = (result[0].isBlock == false) ? { "isBlock": true } : { "isBlock": false },
		// 				options = { new: true };

		// 			await messageSchema.findOneAndUpdate(query, update, options).then(async (data1) => {
		// 				if (data1.receiverId) {
		// 					var receiverId = users.get(JSON.stringify(data1.receiverId))
		// 				}
        //                 console.log("receiverId", receiverId)
		// 				socket.broadcast.to(receiverId).emit('chatResponse', { somedata: data1 });
		// 			})

		// 		}).catch()
		// 	} else {
		// 		let msg = new messageSchema(data)
		// 		roomSchema.findOne({ _id: data.roomId }).then((result) => {
		// 			if (data.receiverId) {
		// 				msg.receiverId = result.participants.filter(function (data2) {
		// 					if (data2 != data.senderId) {
		// 						return data2
		// 					}
		// 				})
		// 			}
		// 			msg.save(function (error, chatData) {
		// 				if (chatData) {
		// 					messageSchema.findOne({ _id: chatData._id }).populate('senderId', 'name _id imageUrl isDeleted')
							
		// 						.then(async (result1) => {
		// 							if (result1) {
		// 								if (result1.receiverId) {
		// 									var receiverId = users.get(JSON.stringify(result1.receiverId))
		// 								}

        //                                 console.log("receiverId", receiverId)
		// 								socket.broadcast.to(receiverId).emit('chatResponse', { somedata: result1 });
		// 							}
		// 						})
		// 				}
		// 				else {
		// 					console.log("error===============================>", error)

		// 				}
		// 			})
		// 		})
		// 	}
		// })
	})
}
