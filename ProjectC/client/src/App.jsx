import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import RoomModal from './components/RoomModal';
import Toolbar from './components/Toolbar';
import Whiteboard from './components/Whiteboard';
import Header from './components/Header';
import SnapshotModal from './components/SnapshotModal';
import './index.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [error, setError] = useState(null);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    const socketInstance = io('http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server:', socketInstance.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    socketInstance.on('error', (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    socketInstance.on('room-created', (data) => {
      setCurrentRoom(data);
      setShowRoomModal(false);
    });

    socketInstance.on('room-joined', (data) => {
      setCurrentRoom({ roomId: data.roomId, roomName: data.roomName });
      setUserCount(data.userCount);
      setShowRoomModal(false);
      
      if (data.elements && canvasRef.current) {
        canvasRef.current.loadElements(data.elements);
      }
    });

    socketInstance.on('user-joined', (data) => {
      setUserCount(data.userCount);
    });

    socketInstance.on('user-left', (data) => {
      setUserCount(data.userCount);
    });

    socketInstance.on('draw', (data) => {
      if (canvasRef.current) {
        canvasRef.current.addRemoteElement(data.element);
      }
    });

    socketInstance.on('update-element', (data) => {
      if (canvasRef.current) {
        canvasRef.current.updateElement(data.elementId, data.updates);
      }
    });

    socketInstance.on('delete-element', (data) => {
      if (canvasRef.current) {
        canvasRef.current.deleteElement(data.elementId);
      }
    });

    socketInstance.on('clear-canvas', () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });

    socketInstance.on('snapshot-loaded', (data) => {
      if (canvasRef.current) {
        canvasRef.current.loadElements(data.elements);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleCreateRoom = (roomName, password) => {
    if (socket) {
      socket.emit('create-room', { roomName, password });
    }
  };

  const handleJoinRoom = (roomId, password) => {
    if (socket) {
      socket.emit('join-room', { roomId, password });
    }
  };

  const handleLeaveRoom = () => {
    if (socket && currentRoom) {
      socket.emit('leave-room', { roomId: currentRoom.roomId });
      setCurrentRoom(null);
      setShowRoomModal(true);
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    }
  };

  const handleCopyLink = () => {
    if (currentRoom) {
      const link = `${window.location.origin}?room=${currentRoom.roomId}`;
      navigator.clipboard.writeText(link);
    }
  };

  const handleSaveSnapshot = (name) => {
    if (socket && currentRoom) {
      socket.emit('save-snapshot', { 
        roomId: currentRoom.roomId, 
        name 
      });
    }
  };

  const handleLoadSnapshot = (snapshotId) => {
    if (socket && currentRoom) {
      socket.emit('load-snapshot', { 
        roomId: currentRoom.roomId, 
        snapshotId 
      });
    }
  };

  const handleGetSnapshots = () => {
    if (socket && currentRoom) {
      socket.emit('get-snapshots', { roomId: currentRoom.roomId });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <Header 
        currentRoom={currentRoom}
        userCount={userCount}
        isConnected={isConnected}
        onLeaveRoom={handleLeaveRoom}
        onCopyLink={handleCopyLink}
        onOpenSnapshots={() => {
          handleGetSnapshots();
          setShowSnapshotModal(true);
        }}
      />
      
      {currentRoom ? (
        <div className="flex-1 flex relative">
          <Toolbar 
            socket={socket}
            currentRoom={currentRoom}
            canvasRef={canvasRef}
          />
          <Whiteboard 
            ref={canvasRef}
            socket={socket}
            currentRoom={currentRoom}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Real-time Collaborative Whiteboard
            </h1>
            <p className="text-gray-600 mb-8">
              Create or join a room to start collaborating with your team
            </p>
          </div>
        </div>
      )}

      {showRoomModal && (
        <RoomModal 
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {showSnapshotModal && (
        <SnapshotModal 
          socket={socket}
          onClose={() => setShowSnapshotModal(false)}
          onSaveSnapshot={handleSaveSnapshot}
          onLoadSnapshot={handleLoadSnapshot}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}
    </div>
  );
}

export default App;
