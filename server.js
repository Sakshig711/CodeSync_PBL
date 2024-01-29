// Import necessary modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Create an Express app
const app = express();

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a Socket.IO server using the HTTP server
const io = socketIo(server);

// Serve static files from the 'public' directory.
app.use(express.static(path.join(__dirname, 'client')));

// Enable JSON parsing for POST requests
app.use(express.json());

app.get('/',(req, res) => {
  res.sendFile(path.join(__dirname, 'client','loginPage.html'));
})

// Map of room IDs to socket IDs
const roomSocketMap = {};

// Define a route to serve the editor page based on the room ID
app.get('/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  // Serve the editor page for the specified room ID
  res.sendFile(path.join(__dirname, 'client', 'editorPage.html'));
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  // Log when a user is connected
  console.log('A user connected');

  // Listen for joining a room
  socket.on('joinRoom', (roomId) => {
    // Join the specified room
    socket.join(roomId);

    // Map the room ID to the socket ID
    roomSocketMap[socket.id] = roomId;
  });

  // Listen for text updates from clients and broadcast them to others in the same room
  socket.on('textUpdate', (text) => {
    const roomId = roomSocketMap[socket.id];

    // Broadcast the text update to all clients in the same room
    io.to(roomId).emit('textUpdate', { id: socket.id, text });
  });

  // Listen for disconnection and log it
  socket.on('disconnect', () => {
    console.log('User disconnected');

    // Remove the socket ID mapping when a user disconnects
    delete roomSocketMap[socket.id];
  });
});

// Set the port for the server to listen on
const PORT = process.env.PORT || 3000;

// Start the server and log the port it's listening on
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
