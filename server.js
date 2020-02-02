// API ChatApp v1.0
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

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
    

    app.listen(4000);
})


// API end points starts here 

app.get('/chats', (req, res) => {
    db.collection('Chats').find().toArray(function(err, result) {
		console.log("GET/CHATS", "|", new Date())

		if(err){
			res.send(err)
		} else {
			res.send(result);
		}
    })
       
})
.post('/chats', (req, res) => {
	let chatName = req.body.chatName;
	let displayName = req.body.displayName;
	let isPublic = req.body.isPublic;
	
	console.log("POST/CHATS", chatName, displayName, isPublic, "|", new Date())
	
	db.collection('Chats').findOne({"chatName": chatName}, function(err, result) {
		if(err || result == null) {
			db.collection('Chats').insertOne({"chatName": chatName, "displayNames": [displayName], "isPublic": isPublic}, function(err, insertResult) {
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
    db.collection('DisplayNames').find().toArray(function(err, result) {
		console.log("GET/DISPLAYNAMES", "|", new Date())

		if(err){
			res.send(err)
		} else {
			res.send(result);
		}
    })
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
	db.collection('Messages').insertOne({"chat": chat, "displayName": displayName, "message": message, "timeStamp": new Date()}, function(err, insertRes) {
		if(err) {
			res.send(err)
		} else {
			res.send(insertRes.message)
		}
	})
})



