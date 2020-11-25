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

		socket.on('chatData', function (data) {
			if (data.isBlocked == true) {
				let query = {
					"senderId": { $in: [data.senderId, data.receiverId] },
					"receiverId": { $in: [data.senderId, data.receiverId] },
				};
				messageSchema.find(query).sort({ $natural: -1 }).limit(1).then(async (result) => {
					let query = { _id: result[0]._id },
						update = (result[0].isBlock == false) ? { "isBlock": true } : { "isBlock": false },
						options = { new: true };

					await messageSchema.findOneAndUpdate(query, update, options).then(async (data1) => {
						if (data1.receiverId) {
							var receiverId = users.get(JSON.stringify(data1.receiverId))
						}
						// if (data1.businessReceiverId) {
						// 	var receiverId = users.get(JSON.stringify(data1.businessReceiverId))
						// }
						// if (data1.businessSenderId) {
						// 	await uniquedata(data1.receiverId)
						// 	await uniquedata(data1.businessSenderId)

						// } else if (data1.senderId) {
						// 	await uniquedata(data1.senderId)
						// 	await uniquedata(data1.businessReceiverId)

						// }
                        console.log("receiverId", receiverId)
						socket.broadcast.to(receiverId).emit('chatResponse', { somedata: data1 });
					})

				}).catch()
			} else {
				let msg = new messageSchema(data)
				roomSchema.findOne({ _id: data.roomId }).then((result) => {
					// if (data.businessReceiverId) {
					// 	msg.businessReceiverId = result.participants.filter(function (data2) {
					// 		if (data2 != data.senderId) {
					// 			return data2
					// 		}
					// 	})
					// }
					if (data.receiverId) {
						msg.receiverId = result.participants.filter(function (data2) {
							if (data2 != data.senderId) {
								return data2
							}
						})
					}
					msg.save(function (error, chatData) {
						if (chatData) {
							messageSchema.findOne({ _id: chatData._id }).populate('senderId', 'name _id imageUrl isDeleted')
								// .populate('businessSenderId', '_id name createdBy isDeleted')
								.then(async (result1) => {
									if (result1) {
										if (result1.receiverId) {
											var receiverId = users.get(JSON.stringify(result1.receiverId))
										}

                                        console.log("receiverId", receiverId)
										socket.broadcast.to(receiverId).emit('chatResponse', { somedata: result1 });
									}
								})
						}
						else {
							console.log("error===============================>", error)

						}
					})
				})
			}
		})
		// socket.on('uniquechat', async (id) => {
		// 	await uniquedata(id)
		// })
		// socket.on('updateRead', function (data) {

		// 	if (data.receiverId) {
		// 		var query = { businessReceiverId: ObjectId(data.id), senderId: ObjectId(data.receiverId) };
		// 	} else if (data.businessReceiverId) {
		// 		var query = { receiverId: ObjectId(data.id), businessSenderId: ObjectId(data.businessReceiverId) };
		// 	}
		// 	messageSchema.find(query).then((result) => {

		// 		result.map(async (msg, i) => {

		// 			let query = { _id: msg._id },
		// 				update = { status: status.read },
		// 				options = { new: true }
		// 			await messageSchema.findOneAndUpdate(query, update, options).then((chatData) => {
		// 				if ((i + 1) == result.length) {

		// 					if (chatData.businessSenderId) {

		// 						uniquedata(chatData.receiverId)
		// 						uniquedata(chatData.businessSenderId)

		// 					} else if (chatData.senderId) {

		// 						uniquedata(chatData.senderId)
		// 						uniquedata(chatData.businessReceiverId)

		// 					}
		// 				}



		// 			})
		// 		})
		// 	}).catch((err) => {
		// 		res.json({ code: code.ineternalError, message: msg.internalServerError })

		// 	})
		// })
		// async function uniquedata(id) {
		// 	try {
		// 		let rooms = await roomSchema.find({ participants: { $all: id } });
		// 		if (rooms.count == 0) {

		// 			return [];
		// 		}
		// 		let result = rooms.map(async room => {

		// 			let lastmessage = messageSchema.findOne({ roomId: room._id }).sort({ $natural: -1 })
		// 				.populate('senderId', '_id name imageUrl isDeleted')
		// 				.populate('businessSenderId', '_id name createdBy isDeleted')
		// 				.populate('receiverId', '_id name imageUrl isDeleted')
		// 				.populate('businessReceiverId', '_id name createdBy isDeleted')
		// 				.limit(1);
		// 			let unreadedMessages = messageSchema.find({ $or: [{ receiverId: id }, { businessReceiverId: id }], roomId: room._id, status: status.unread }).count()
		// 			return Promise.all([lastmessage, unreadedMessages])

		// 		});
		// 		var receiverId1 = await users.get(JSON.stringify(id))
		// 		let finalresult = await Promise.all(result)

		// 		finalresult = finalresult.map(res => {
		// 			if (!res[0]) {
		// 				return ;
		// 			}
		// 			// console.log("uniquedata -> res[0]", res[0])
		// 			let result = JSON.parse(JSON.stringify(res[0]));
		// 			// console.log("uniquedata -> result", result)
		// 			result.count = res[1];
		// 			return result;
		// 		})
		// 		finalresult = finalresult.filter(ele => {
		// 			if(ele) {
		// 				return ele;
		// 			}
		// 		})

		// 		await io.to(receiverId1).emit('uniquechatResponse', { somedata: finalresult });
		// 	} catch (error) {
		// 		console.log("err", error);
		// 	}

		// }
	})
}
