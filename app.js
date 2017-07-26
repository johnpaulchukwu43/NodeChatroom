
//noinspection JSUnresolvedFunction
/**
 * Module dependencies.
 */

var express = require('express');
//noinspection JSUnresolvedFunction
var routes = require('./routes');
var express = require('express');
var path = require('path');
var http = require('http');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
// var config = require('/config').database;
var app = express();
// all environments
app.set('port', process.env.PORT || 3000);
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', routes.index);


var serve = http.createServer(app);
var io = require('socket.io')(serve);

//Setup mongodb
var mongo = require('mongodb').MongoClient;

serve.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

io.on('connection', function (socket) {
    console.log('a user connected');

    mongo.connect("mongodb://localhost/ChatRoom", function (err, db) {
        if(err){
            console.warn(err.message);
        } else {
            var collection = db.collection('chat messages');
            var stream = collection.find().sort().limit(10).stream();
            stream.on('data', function (chat) { console.log('emitting chat'); socket.emit('chat', chat.content); });
        }
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('chat', function (msg) {
        mongo.connect("mongodb://localhost/ChatRoom", function (err, db) {
            if(err){
                console.warn(err.message);
            } else {
                var collection = db.collection('chat messages');
                collection.insert({ content: msg }, function (err, o) {
                    if (err) { console.warn(err.message); }
                    else { console.log("chat message inserted into db: " + msg); }
                });
            }
        });

        socket.broadcast.emit('chat', msg);
    });
});
