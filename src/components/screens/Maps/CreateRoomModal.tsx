import React, { useState } from 'react';
import { useWebSocket } from '../../../context/WebSocketContext';

interface CreateRoomModalProps {
  onClose: () => void;
  latitude: number;
  longitude: number;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, latitude, longitude }) => {
  const [roomName, setRoomName] = useState('');
  const { createRoom } = useWebSocket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      createRoom(roomName.trim(), latitude, longitude);
      onClose();
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create New Room</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            maxLength={50}
            required
          />
          <div className="modal-buttons">
            <button type="submit">Create</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal; 