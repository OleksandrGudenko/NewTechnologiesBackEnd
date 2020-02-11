// API ChatApp with Socket.IO v1.0
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = 5000;
//const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')
const publicChats = [ "Politics", "Religion", "Cars", "Pro Vegan", "Art", "Technology", "Android vs IOS", "PC vs Consoles", "Gamers" ];


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017';

let db;
MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.log(err);
    db = client.db('DB_ChatAPP');
    
    
	io.on("connection", (socket) => {
		console.log("a user has connected!! :D")
	
	/*
		socket.on('join', (callback) => {
		
			socket.emit('message', { user: 'ChatApp', text: `${user.displayName}, welcome to ${user.chatName}`})
			socket.broadcast.to(user.chatName).emit('message', { user: 'ChatName', text: `${user.displayName} is online` })
			socket.join(user.chatName);
		
			callback();
		});*/	
		
		
		// Register new/resuse old DisplayName
		socket.on('submitNameRequest', ({displayName}) => {
			let d = new Date()
			const date = d.getDate()
			const month = d.getMonth() + 1
			const year = d.getFullYear()
			const hours = d.getHours()
			const minutes = d.getMinutes()
			const seconds = d.getSeconds()
			
			console.log("submitNameRequest", "|", date + "-" + month + "-" + year, hours + ":" + minutes + ":" + seconds);

			if(displayName.length > 2 && displayName != null) {
				db.collection('DisplayNames').find({displayName}).toArray(function(err, result) {
					console.log(`SOCKET GET DISPLAYNAME '${displayName}'`)
					console.log("db res: " + result[0])	
											
					if(err){
						console.log(err.toString());
						
					} else if (result.length != 0) {
						if (result[0].inUse) {
							console.log("Name is in use")

							socket.emit('submitNameRequestResponse', {response: false, reason: 'Name is in use.'});

						} else {
							console.log("name exist but is free to use")
														
							db.collection('DisplayNames').updateOne({_id: result[0]._id}, {$set: {inUse: true}}, function (err, res) {
								
								if(err) {
									socket.emit('submitNameRequestResponse', {response: false, reason: 'DataBase Error when Updating.'});

								} else {
									db.collection('DisplayNames').find({_id:result[0]._id }).toArray((err, resName) => {
										if (err) {
											console.log(err);
										} else {
											socket.emit('submitNameRequestResponse', {response: true, reason: 'Old name claimed successfully.', name: resName});
											console.log(resName)

										}
									})
								}
							});

						} 
					} else {
						console.log("no such name in db")
						db.collection('DisplayNames').insertOne({"displayName" : displayName, "chats" : publicChats, "inUse" : true}, function(err, result) {
							if(err){ 
								socket.emit('submitNameRequestResponse', {response: false, reason: 'DataBase Error.'})
							}
							else {
	
											socket.emit('submitNameRequestResponse', {response: true, reason: 'New name claimed.', name: [result.ops[0]]});
											console.log([result.ops[0]])
							}
						});					
						
					}
				
				});
			} else { socket.emit('changeNameRequestResponse', {response: false, reason: 'Name is too short.'}) }
		});
		
		
		// change name when user requests to
		socket.on('changeNameRequest', ({newDisplayName, oldDisplayName}) => {
			let d = new Date()
			const date = d.getDate()
			const month = d.getMonth() + 1
			const year = d.getFullYear()
			const hours = d.getHours()
			const minutes = d.getMinutes()
			const seconds = d.getSeconds()
			
			console.log("114 changeNameRequest", "|", date + "-" + month + "-" + year, hours + ":" + minutes + ":" + seconds);
			
			if(newDisplayName != oldDisplayName && newDisplayName.length > 2 && newDisplayName != null) {
				let oldName;
				db.collection('DisplayNames').find({"displayName": oldDisplayName}).toArray((err, res) => {
					
					console.log("oldName: " + res)
					if(err) {
						console.log(err)
					} else {
						oldName = res
					}
				});
				
				db.collection('DisplayNames').find({"displayName": newDisplayName}).toArray((err, result) => {
					
					if(err){
						console.log(err.toString());
						return
						
					} else if (result.length != 0) {

						if (result[0].inUse) {
							console.log("Name is in use")
							
							socket.emit('changeNameRequestResponse', {response: false, reason: 'Name is already in use.'});
							return

						} else {
							console.log("name exist but is free to use")
														
							db.collection('DisplayNames').updateOne({_id: result[0]._id}, {$set: { inUse: true }}, function (err, res) {
								if (err) {
									console.log(err)
									socket.emit('changeNameRequestResponse', {response: false, reason: 'DataBase Error.'});

								} else {
									db.collection('DisplayNames').updateOne({_id: oldName[0]._id}, {$set: { inUse: false }}, function (err, res) {
										if (err) {
											console.log(err)

										} else {
											db.collection('DisplayNames').find({_id:result[0]._id }).toArray((err, resName) => {
												if (err) {
													console.log(err);
												} else {
													socket.emit('changeNameRequestResponse', {response: true, reason: 'Name with history claimed.', name: resName});
													console.log(resName)

												}
											})

										}
									})
								}
							});

						} 
					} else {
						db.collection('DisplayNames').insertOne({"displayName" : newDisplayName, "chats" : publicChats, "inUse" : true}, function (err, results) {
							if(err){ 
								console.log(err);
								socket.emit('changeNameRequestResponse', {response: false, reason: 'DataBase Error.'});

							}
							else {
								db.collection('DisplayNames').updateOne({_id: oldName[0]._id}, {$set: { inUse: false }}, function (err, res) {
									if (err) {
										console.log(err)

									} else {
										socket.emit('changeNameRequestResponse', {response: true, reason: 'Name without history claimed.', name: [results.ops[0]]})
										console.log([results.ops[0]])
									}
								})
								
							}
						}) 
			
					}				
				});
			} else { socket.emit('changeNameRequestResponse', {response: false, reason: 'Name is too short or New and Old names are equal.'}) } 
		});
			
		socket.on('loginRequest', ({displayName}) => {
			let d = new Date()
			const date = d.getDate()
			const month = d.getMonth() + 1
			const year = d.getFullYear()
			const hours = d.getHours()
			const minutes = d.getMinutes()
			const seconds = d.getSeconds()
			
			console.log("loginRequest", "|", date + "-" + month + "-" + year, hours + ":" + minutes + ":" + seconds);

			db.collection('DisplayNames').find({displayName}).toArray(function(err, result) {
				console.log(`SOCKET GET LOGIN AS '${displayName}' REQUEST`)
				
				if(err){
					console.log(err.toString());
					socket.emit('loginRequstResponse', { response: 'DataBase Error.'})
					
				} else if(!Array.isArray(result) || result.length == 0) {
					socket.emit('loginRequestResponse', {response:  false, reason: 'Your name is not in database.'});
	
				} else {
					socket.emit('loginRequestResponse', {response: true, name: result});
					console.log("result inside socket emit", result);
					db.collection('DisplayNames').updateOne({_id: result[0]._id}, {$set: { inUse: true }}, function (err, res) {
						if (err) {
							console.log(err)
						} 
					})
				}
			});
		});
			
		
		socket.on('sendMessage', (message, callback) => {
			const user = getUser(socket.id);
			
			io.to(user.chatName).emit('message', { user: user.displayName, text: message })
			
			callback();
		});
		
		
		socket.on('disconnect', () => {
			console.log('a user has dissconected :(')
		});
	});


	server.listen(port, () => console.log("server is running on port " + port))

})


app.get('/chats', (req, res) => {
	let chatName = req.query.chatName;

	if(chatName) {
		db.collection('Chats').find({"chatName": chatName}).toArray(function(err, result) {
			console.log("GET/CHATS", "|", new Date())
	
			if(err){
				res.send(err)
			} else {
				res.send(result);
			}
		})
	} else {
		db.collection('Chats').find({}).toArray(function(err, result) {
			console.log("GET/CHATS", "|", new Date())
	
			if(err){
				res.send(err)
			} else {
				res.send(result);
			}
		})
	}       
})
.post('/chats', (req, res) => {
	let chatName = req.body.chatName;
	let displayName = req.body.displayName;
	let isPublic = req.body.isPublic;
	
	console.log("POST/CHATS", chatName, displayName, isPublic, "|", new Date())
	
	db.collection('Chats').findOne({"chatName": chatName}, function(err, result) {
		if(err || result == null) {
			db.collection('Chats').insertOne({"chatName": chatName, "displayNames": [displayName], "isPublic": isPublic, "latestMessage": ""}, function(err, insertResult) {
				if(!err){ 
					res.send(insertResult);
				}
				else {
					res.send(err);
				}
			})
		} else {
			res.send("Sorry, Chat name is alredy in use.");
		}
	})
})
.get('/displaynames', (req, res) => {
	let displayName = req.query.displayName;
	
	if (displayName) {
		
		db.collection('DisplayNames').find({"displayName": displayName}).toArray(function(err, result) {
			console.log("GET/DISPLAYNAMES", "|", new Date())

			if(err){
				res.send(err)
			} else {
				res.send(result);
			}
		})
		
	} else {
	
		db.collection('DisplayNames').find().toArray(function(err, result) {
			console.log("GET/DISPLAYNAMES", "|", new Date())

			if(err){
				res.send(err)
			} else {
				res.send(result);
			}
		})
	}
})
.post('/displaynames', (req, res) => {
	let displayName = req.body.displayName;
	let publicChats = [ "Politics", "Religion", "Cars", "Pro Vegan", "Art", "Technology", "Android vs IOS", "PC vs Consoles", "Gamers" ];
	
	console.log("POST/DISPLAYNAMES", displayName, "|", new Date())
	
	db.collection('DisplayNames').find({"displayName" : displayName}).toArray( function(err, result) {
		if(result.length == 0){
			db.collection('DisplayNames').insertOne({"displayName" : displayName, "chats" : publicChats, "inUse" : true}, function(err, results) {
				if(err){ 
					res.send(err);
				}
				else {
					res.send(results);
				}
			})
		} else {
			res.send("Sorry, name is already in use.");
		}
	})
})
.get('/messages', (req, res) => {
    let reqchat = req.query.chat;
	console.log("GET/MESSAGES", "|", new Date())

    if (reqchat != null) {
        db.collection('Messages').find({chat : reqchat }).toArray(function(err, result) {
			if(err){
				res.send(err)
			} else {
				res.send(result);
			}		
		})
    } else {
        db.collection('Messages').find({}).toArray(function(err, result) {
			if(err){
				res.send(err)
			} else {
				res.send(result);
			}
		})
    }
})
.post('/messages', (req, res) => {
	let chat = req.body.chat;
	let displayName = req.body.displayName;
	let message = req.body.message;
	
	console.log("POST/MESSAGES",chat, displayName, message, "|", new Date())
	
	db.collection('Chats').find({"chatName": chat}).toArray( function(err, findRes) {		
		console.log(findRes)
		let chatId = findRes[0]._id

		db.collection('Messages').insertOne({"chat": chat, "displayName": displayName, "message": message, "timeStamp": new Date()}, function(err, insertRes) {
			if(err) {
				res.send(err)
			} else {
				db.collection('Chats').updateOne({"_id": chatId}, {$set: {"latestMessage": message}}, function (err, updateRes) {
					if(err) {
						res.send(err)
					} else {
						res.send(updateRes)
					}
				})
			}
		})
	})	
})


