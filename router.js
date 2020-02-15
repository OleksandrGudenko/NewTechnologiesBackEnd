const express = require('express');
const router = express.Router();
const db = req.app.locals.db;

router.get('/chats', (req, res) => {
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

module.exports = router;
