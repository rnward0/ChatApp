//The basic Socket.io code was provided by the tutorial in the assignment description at https://socket.io/get-started/chat/

var express = require('express');

var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

let connections = [];
let userList = [];
let messages = [];

io.on('connection', (socket) => {
    console.log('a user connected');

    let userNum = 0;
    if (connections.length === 0) userNum = 1;
    else userNum = connections[connections.length-1].userNumber + 1;

    let connection = {
        socketID: socket.id,
        userNumber: userNum,
        username: 'User' + userNum
    }
    connections.push(connection);
    userList.push(connection.username);

    messages.forEach(function(item){
        io.to(socket.id).emit('chat message', item);
    });

    let msg = 'You are User' + userNum;  //send user message only to client socket
    io.to(socket.id).emit('chat message', msg, true);

    io.emit('connected', userList);  //update list of users

    socket.on('disconnect', () => {
        console.log('a user disconnected');
        var index = connections.findIndex(connection => connection.socketID === socket.id);
        connections.splice(index, 1);
        userList.splice(index, 1);
        io.emit('disconnect', userList);
        if(connections.length === 0) messages = [];
    });
    socket.on('chat message', (msg) => {
        if(msg.includes('/name')){
            if(!msg.includes('<') || !msg.includes('>')){
                io.to(socket.id).emit('chat message', 'Error: Invalid command.', true);
            }
            else {
                var start = msg.indexOf('<') + 1;
                var end = msg.indexOf('>');
                var newName = msg.substring(start, end);
                var nameExists = false;

                for (name in userList){
                    if (userList[name] === newName) {
                        io.to(socket.id).emit('chat message', 'Error: Username is already in use, please pick a unique name.', true);
                        nameExists = true;
                    }
                }
                if (!nameExists){
                    var index = connections.findIndex(connection => connection.socketID === socket.id);
                    userList[index] = newName;
                    connections[index].username = newName;
                    io.emit('connected', userList);
                    io.emit('change name', userList, newName);
                    io.to(socket.id).emit('chat message', 'Your username is now ' + userList[index], true);
                }
            }
        }
        else if(msg.includes('/')){
            io.to(socket.id).emit('chat message', 'Error: Invalid command.', true);
        }
        else{
            var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var index = connections.findIndex(connection => connection.socketID === socket.id);
            var name = connections[index].username;
            msg = time + ' ' + name + ': ' + msg;

            if (messages.length === 200) messages.shift();
            
            messages.push(msg);
            io.to(socket.id).emit('chat message', msg, true); //Send message to client only to be bolded (True)
            socket.broadcast.emit('chat message', msg, false); //Send message to other users to be displayed unbolded (False)
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});