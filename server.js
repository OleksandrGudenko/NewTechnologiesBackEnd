
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({extended: true}))


const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://127.0.0.1:27017'
// const url2 = 'mongodb://newtechproject.ddns.net:27017'

var db

MongoClient.connect(url, (err, client) => {
    if (err) return console.log(err)
    db = client.db('DB_ChatAPP')
    
   // let api = require('./routes/api/Chat/chat_app_api_v1');
   // app.use('/api/', api);
    
    app.listen(4000)
})


   
app.get('/groups', (req, res) => {
    var cursor = db.collection('Groups').find().toArray(function(err, results) {
       res.send(results)
       })
       
})
.get('/displaynames', (req, res) => {
    var cursor = db.collection('DisplayNames').find().toArray(function(err, results) {
       res.send(results)
       })
})
.get('/messages', (req, res) => {
    var cursor = db.collection('Messages').find().toArray(function(err, results) {
       res.send(results)
       })
})



