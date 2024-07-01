const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('A user connected');

  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;
    waitingUser.emit('chat message', 'You are now connected to a stranger.');
    socket.emit('chat message', 'You are now connected to a stranger.');
    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit('chat message', 'Waiting for a stranger to connect...');
  }

  socket.on('chat message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('chat message', msg);
    }
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('chat message', 'Stranger has disconnected.');
      socket.partner.partner = null;
    } else if (waitingUser === socket) {
      waitingUser = null;
    }
    console.log('User disconnected');
  });
});

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
