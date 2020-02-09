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
		socket.on('displayNameRequest', ({displayName}) => {
			console.log(displayName);
				db.collection('DisplayNames').find({displayName}).toArray(function(err, result) {
					console.log(`SOCKET GET DISPLAYNAME '${displayName}'`, "|", new Date())
					console.log(result)
					
					let _id = result[0]._id;
					
					if(err){
						console.log(err.toString());
						
					} else if (result.length != 0) {
						if (result[0].inUse) {
							console.log("Name is in use")

							socket.emit('nameRequestResponse', {response:'Name is in use.'});

						} else {
							console.log("name exist but is free to use")

							delete result[0]['_id']
							result[0].inUse = false;
														
							db.collection('DisplayNames').updateOne({_id: ObjectId(_id)}, result[0]);
							socket.emit('nameRequestResponse', {response:'Name exist but is free to use.'});

						} 
					} else {
						console.log("no such name in db")
						socket.emit('nameRequestResponse', {response:'No such name in DB.'});
						
					}
					
				});
		});
		
		
		// change name when user requests to
		socket.on('changeNameRequest', ({newDisplayName, oldDisplayName}) => {
			console.log("changeNameRequest")
			if(newDisplayName != oldDisplayName && newDisplayName != '' && newDisplayName != null) {
				let oldName = []
				db.collection('DisplayNames').find({"displayName": oldDisplayName}).toArray((err, res) => {
					
					console.log(res)
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
						let _id = result[0]._id;

						if (result[0].inUse) {
							console.log("Name is in use")
							
							socket.emit('changeNameRequestResponse', {response:'Booked'});
							return

						} else {
							console.log("name exist but is free to use")
														
							db.collection('DisplayNames').updateOne({_id: ObjectId(_id)}, {$set: { inUse: true }}, function (err, res) {
								if (err) {
									console.log(err)
									socket.emit('changeNameRequestResponse', {response:'Internal Error'});

								} else {
									socket.emit('changeNameRequestResponse', {response:'Reused'});
								}
							});

						} 
					} else {
						db.collection('DisplayNames').insertOne({"displayName" : newDisplayName, "chats" : publicChats, "inUse" : true}, function(err, results) {
							if(err){ 
								console.log(err);
							}
							else {
							socket.emit('changeNameRequestResponse', {response: 'New'})

							  if (oldName.length == 0) { return } else {
									db.collection('DisplayNames').updateOne({_id: ObjectId(oldName._id)}, {$set: { inUse: false }}, function (err, res) {
										if (err) {
											console.log(err)
										}
									})
								}
							}
						})					
					}				
				});
			} else { socket.emit('changeNameRequestResponse', {response: 'New and Old names are equal.'}) } 
		});
			
		socket.on('loginRequestBackEND', ({displayName}) => {
			db.collection('DisplayNames').find({displayName}).toArray(function(err, result) {
					console.log(`SOCKET GET LOGIN AS '${displayName}' REQUEST`, "|", new Date())
					console.log(result)
					
					if(err){
						console.log(err.toString());
						
					} else {
						socket.emit('loginRequestClient', {response: {displayName: result}});
						
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


