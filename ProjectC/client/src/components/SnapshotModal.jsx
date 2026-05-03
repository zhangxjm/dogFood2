import { useState, useEffect } from 'react';
import { X, Save, Clock, Download } from 'lucide-react';

function SnapshotModal({ socket, onClose, onSaveSnapshot, onLoadSnapshot }) {
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleSnapshotsList = (data) => {
      setSnapshots(data.snapshots || []);
    };

    const handleSnapshotSaved = (data) => {
      setSnapshots(prev => [data.snapshot, ...prev]);
      setIsSaving(false);
      setSnapshotName('');
    };

    socket.on('snapshots-list', handleSnapshotsList);
    socket.on('snapshot-saved', handleSnapshotSaved);

    return () => {
      socket.off('snapshots-list', handleSnapshotsList);
      socket.off('snapshot-saved', handleSnapshotSaved);
    };
  }, [socket]);

  const handleSave = (e) => {
    e.preventDefault();
    if (snapshotName.trim()) {
      setIsSaving(true);
      onSaveSnapshot(snapshotName.trim());
    }
  };

  const handleLoad = (snapshotId) => {
    onLoadSnapshot(snapshotId);
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock size={20} />
            Snapshots
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Save New Snapshot */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Save Current State</h3>
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot name"
              className="flex-1 input-field"
              required
            />
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary w-auto flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>

        {/* Snapshot List */}
        <div className="flex-1 overflow-y-auto">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock size={48} className="mx-auto mb-3 opacity-50" />
              <p>No snapshots yet</p>
              <p className="text-sm">Save your first snapshot to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{snapshot.name}</h4>
                    <p className="text-sm text-gray-500">
                      {formatDate(snapshot.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLoad(snapshot.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SnapshotModal;
