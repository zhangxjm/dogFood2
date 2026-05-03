const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const useMongoDB = process.env.USE_MONGODB === 'true';
let Room;
let WhiteboardSnapshot;

const inMemoryRooms = new Map();
const inMemorySnapshots = new Map();

async function initDatabase() {
  if (useMongoDB) {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard');
      console.log('MongoDB connected');
      
      Room = require('./models/Room');
      WhiteboardSnapshot = require('./models/WhiteboardSnapshot');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      console.log('Falling back to in-memory storage');
    }
  } else {
    console.log('Using in-memory storage');
  }
}

initDatabase();

const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', async ({ roomName, password }) => {
    try {
      const roomId = generateRoomId();
      const hashedPassword = password ? await bcryptjs.hash(password, 10) : null;
      
      if (useMongoDB && Room) {
        const room = new Room({
          roomId,
          name: roomName,
          password: hashedPassword,
          createdBy: socket.id,
          users: [socket.id]
        });
        await room.save();
      } else {
        inMemoryRooms.set(roomId, {
          roomId,
          name: roomName,
          password: hashedPassword,
          createdBy: socket.id,
          users: [socket.id],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      socket.join(roomId);
      activeRooms.set(roomId, {
        id: roomId,
        name: roomName,
        users: new Set([socket.id]),
        elements: [],
        snapshots: []
      });
      
      socket.emit('room-created', { roomId, roomName });
      console.log(`Room created: ${roomId} by ${socket.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('join-room', async ({ roomId, password }) => {
    try {
      let room;
      
      if (useMongoDB && Room) {
        room = await Room.findOne({ roomId });
      } else {
        room = inMemoryRooms.get(roomId);
      }
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.password) {
        const isValidPassword = await bcryptjs.compare(password, room.password);
        if (!isValidPassword) {
          socket.emit('error', { message: 'Invalid password' });
          return;
        }
      }

      socket.join(roomId);
      
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          id: roomId,
          name: room.name,
          users: new Set(),
          elements: [],
          snapshots: []
        });
      }
      
      const activeRoom = activeRooms.get(roomId);
      activeRoom.users.add(socket.id);
      
      if (useMongoDB && Room) {
        if (!room.users.includes(socket.id)) {
          room.users.push(socket.id);
          await room.save();
        }
      } else {
        if (!room.users.includes(socket.id)) {
          room.users.push(socket.id);
          room.updatedAt = new Date();
        }
      }
      
      socket.emit('room-joined', { 
        roomId, 
        roomName: room.name,
        elements: activeRoom.elements,
        userCount: activeRoom.users.size
      });
      
      io.to(roomId).emit('user-joined', { 
        userId: socket.id, 
        userCount: activeRoom.users.size 
      });
      
      console.log(`User ${socket.id} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('leave-room', async ({ roomId }) => {
    try {
      socket.leave(roomId);
      
      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        room.users.delete(socket.id);
        
        if (room.users.size === 0) {
          activeRooms.delete(roomId);
        } else {
          io.to(roomId).emit('user-left', { 
            userId: socket.id, 
            userCount: room.users.size 
          });
        }
      }
      
      if (useMongoDB && Room) {
        await Room.findOneAndUpdate(
          { roomId },
          { $pull: { users: socket.id } }
        );
      } else {
        const room = inMemoryRooms.get(roomId);
        if (room) {
          room.users = room.users.filter(id => id !== socket.id);
          room.updatedAt = new Date();
        }
      }
      
      console.log(`User ${socket.id} left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('draw', ({ roomId, element }) => {
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      room.elements.push(element);
      
      socket.to(roomId).emit('draw', { element, userId: socket.id });
    }
  });

  socket.on('update-element', ({ roomId, elementId, updates }) => {
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      const index = room.elements.findIndex(el => el.id === elementId);
      
      if (index !== -1) {
        room.elements[index] = { ...room.elements[index], ...updates };
        socket.to(roomId).emit('update-element', { elementId, updates, userId: socket.id });
      }
    }
  });

  socket.on('delete-element', ({ roomId, elementId }) => {
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      room.elements = room.elements.filter(el => el.id !== elementId);
      
      socket.to(roomId).emit('delete-element', { elementId, userId: socket.id });
    }
  });

  socket.on('clear-canvas', ({ roomId }) => {
    if (activeRooms.has(roomId)) {
      const room = activeRooms.get(roomId);
      room.elements = [];
      
      socket.to(roomId).emit('clear-canvas', { userId: socket.id });
    }
  });

  socket.on('save-snapshot', async ({ roomId, name }) => {
    try {
      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        const snapshotId = uuidv4();
        
        if (useMongoDB && WhiteboardSnapshot) {
          const snapshot = new WhiteboardSnapshot({
            roomId,
            name: name || `Snapshot ${new Date().toLocaleString()}`,
            elements: [...room.elements],
            createdBy: socket.id
          });
          
          await snapshot.save();
          
          room.snapshots.push({
            id: snapshot._id,
            name: snapshot.name,
            createdAt: snapshot.createdAt
          });
          
          io.to(roomId).emit('snapshot-saved', {
            snapshot: {
              id: snapshot._id,
              name: snapshot.name,
              createdAt: snapshot.createdAt
            }
          });
        } else {
          const snapshot = {
            _id: snapshotId,
            id: snapshotId,
            roomId,
            name: name || `Snapshot ${new Date().toLocaleString()}`,
            elements: [...room.elements],
            createdBy: socket.id,
            createdAt: new Date()
          };
          
          if (!inMemorySnapshots.has(roomId)) {
            inMemorySnapshots.set(roomId, []);
          }
          inMemorySnapshots.get(roomId).unshift(snapshot);
          
          room.snapshots.unshift({
            id: snapshotId,
            name: snapshot.name,
            createdAt: snapshot.createdAt
          });
          
          io.to(roomId).emit('snapshot-saved', {
            snapshot: {
              id: snapshotId,
              name: snapshot.name,
              createdAt: snapshot.createdAt
            }
          });
        }
        
        console.log(`Snapshot saved for room ${roomId}`);
      }
    } catch (error) {
      console.error('Error saving snapshot:', error);
      socket.emit('error', { message: 'Failed to save snapshot' });
    }
  });

  socket.on('load-snapshot', async ({ roomId, snapshotId }) => {
    try {
      let snapshot;
      
      if (useMongoDB && WhiteboardSnapshot) {
        snapshot = await WhiteboardSnapshot.findById(snapshotId);
      } else {
        const roomSnapshots = inMemorySnapshots.get(roomId) || [];
        snapshot = roomSnapshots.find(s => s.id === snapshotId || s._id === snapshotId);
      }
      
      if (snapshot && activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        room.elements = [...snapshot.elements];
        
        io.to(roomId).emit('snapshot-loaded', {
          elements: snapshot.elements,
          snapshotName: snapshot.name
        });
        
        console.log(`Snapshot ${snapshotId} loaded for room ${roomId}`);
      }
    } catch (error) {
      console.error('Error loading snapshot:', error);
      socket.emit('error', { message: 'Failed to load snapshot' });
    }
  });

  socket.on('get-snapshots', async ({ roomId }) => {
    try {
      let snapshots;
      
      if (useMongoDB && WhiteboardSnapshot) {
        snapshots = await WhiteboardSnapshot.find({ roomId })
          .sort({ createdAt: -1 })
          .select('id name createdAt');
      } else {
        const roomSnapshots = inMemorySnapshots.get(roomId) || [];
        snapshots = roomSnapshots.map(s => ({
          id: s.id || s._id,
          name: s.name,
          createdAt: s.createdAt
        }));
      }
      
      socket.emit('snapshots-list', { snapshots });
    } catch (error) {
      console.error('Error getting snapshots:', error);
      socket.emit('error', { message: 'Failed to get snapshots' });
    }
  });

  socket.on('cursor-move', ({ roomId, position }) => {
    socket.to(roomId).emit('cursor-move', { 
      userId: socket.id, 
      position 
    });
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    for (const [roomId, room] of activeRooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        
        if (room.users.size === 0) {
          activeRooms.delete(roomId);
        } else {
          io.to(roomId).emit('user-left', { 
            userId: socket.id, 
            userCount: room.users.size 
          });
        }
        
        if (useMongoDB && Room) {
          await Room.findOneAndUpdate(
            { roomId },
            { $pull: { users: socket.id } }
          );
        } else {
          const inMemoryRoom = inMemoryRooms.get(roomId);
          if (inMemoryRoom) {
            inMemoryRoom.users = inMemoryRoom.users.filter(id => id !== socket.id);
            inMemoryRoom.updatedAt = new Date();
          }
        }
      }
    }
  });
});

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
