import { Users, Wifi, WifiOff, Copy, LogOut, History } from 'lucide-react';

function Header({ currentRoom, userCount, isConnected, onLeaveRoom, onCopyLink, onOpenSnapshots }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">Whiteboard</h1>
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-500">
                <Wifi size={16} />
                <span className="text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500">
                <WifiOff size={16} />
                <span className="text-sm">Disconnected</span>
              </div>
            )}
          </div>

          {currentRoom && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-gray-600">Room:</span>
                <span className="font-mono font-semibold text-primary-600">
                  {currentRoom.roomId}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-sm font-medium text-gray-700">
                  {currentRoom.roomName}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Users size={18} />
                <span className="text-sm font-medium">{userCount}</span>
              </div>
            </div>
          )}
        </div>

        {currentRoom && (
          <div className="flex items-center gap-3">
            <button
              onClick={onCopyLink}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
              title="Copy room link"
            >
              <Copy size={16} />
              <span>Copy Link</span>
            </button>

            <button
              onClick={onOpenSnapshots}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
              title="Snapshots"
            >
              <History size={16} />
              <span>Snapshots</span>
            </button>

            <button
              onClick={onLeaveRoom}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Leave room"
            >
              <LogOut size={16} />
              <span>Leave</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
