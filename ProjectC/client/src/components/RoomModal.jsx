import { useState } from 'react';
import { Plus, LogIn } from 'lucide-react';

function RoomModal({ onCreateRoom, onJoinRoom }) {
  const [activeTab, setActiveTab] = useState('create');
  const [roomName, setRoomName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      onCreateRoom(roomName.trim(), createPassword || null);
    }
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), joinPassword || null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Collaborative Whiteboard
        </h2>
        
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white text-primary-600 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={18} />
            Create Room
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-white text-primary-600 shadow'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('join')}
          >
            <LogIn size={18} />
            Join Room
          </button>
        </div>

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (Optional)
              </label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Leave empty for public room"
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary">
              Create Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password (If required)
              </label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter password"
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary">
              Join Room
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RoomModal;
