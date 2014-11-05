var express = require('express');
var http = require('http')
     ,fs = require('fs')
	 ,path = require("path")
	 ,app = express()
	 ,port = process.env['PORT'] || 7001
	
app.use(express.static(__dirname + '/'))
	
var httpserver = http.createServer(function (request, response) {
	fs.readFile("client.html", 'utf-8', function (error, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    }); 
	
	/*var now = new Date();
 
	var filename = "\client.html";
	var ext = path.extname(filename);
	var localPath = __dirname;
	console.log("localPath : "+localPath);
	console.log("filename : "+filename);
	var validExtensions = {
		".html" : "text/html",			
		".js": "application/javascript", 
		".css": "text/css",
		".txt": "text/plain",
		".jpg": "image/jpeg",
		".gif": "image/gif",
		".png": "image/png"
	};
	var isValidExt = validExtensions[ext];
 
	if (isValidExt) {
		
		localPath += filename;
		path.exists(localPath, function(exists) {
			if(exists) {
				console.log("Serving file: " + localPath);
				getFile(localPath, response, ext);
			} else {
				console.log("File not found: " + localPath);
				response.writeHead(404);
				response.end();
			}
		});
 
	} else {
		console.log("Invalid file extension detected: " + ext)
	}*/
	
}).listen(port);


function getFile(localPath, res, mimeType) {
	fs.readFile(localPath, function(err, contents) {
		if(!err) {
			res.setHeader("Content-Length", contents.length);
			res.setHeader("Content-Type", mimeType);
			res.statusCode = 200;
			res.end(contents);
		} else {
			res.writeHead(500);
			res.end();
		}
	});
}

console.log("Server is running on the port : "+port);

var io = require('socket.io').listen(httpserver);

var chatMessage = [];
var joinMessage = [];
var chatterName = [];
var messObj = {};
var storeMessage = function(name,data){
	messObj = {name:name,data:data}
	chatMessage.push(messObj);
	if(chatMessage.length  > 20){
		chatMessage.shift();
	}
}

var storeJoinMessage = function(message){
	joinMessage.push(message);
}

var storeChatterName = function(name){
	chatterName.push(name)
}

io.on('connection', function(client) {
	console.log("Client connected..");
	client.on('join',function(name){
		client.name = name;
		storeJoinMessage(name+" joined the chat");
		storeChatterName(name);
		
		joinMessage.forEach(function(message){
			client.emit("join_message",message);
		});
		chatterName.forEach(function(name){
			client.emit("chatter_list",name);
		});
		
		chatMessage.forEach(function(message){
			client.emit("message_from_server",message.name+": "+message.data);		
		});		
		client.broadcast.emit("join_message", name+" joined the chat"); // Broadcast join message  to all the users in the chat		
	});
	
    client.on('message_from_client', function(data) {
		//When we receive messages from client, we need to emit to client to display
		var clientName = client.name;
		console.log(client.name+": "+data);
		client.broadcast.emit("message_from_server",client.name+": "+data); // Broadcast chat messages to all the users in the chat
		client.emit("message_from_server",client.name+": "+data); // Emit chat message to the chat window
		storeMessage(client.name,data);
    });
	
	
});

