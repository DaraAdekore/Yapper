import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useWebSocket } from '../../../context/WebSocketContext';
import { RootState } from '../../../store';
import { MessageType } from '../../../Types/Types';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateRoomModalProps {
    onClose: () => void;
    latitude: number;
    longitude: number;
}

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 20px;
    font-size: 1.5rem;
    color: #fff;
  }

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      color: #ccc;
    }

    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #333;
      border-radius: 6px;
      background: #2a2a2a;
      color: white;
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: #4a9eff;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    button {
      padding: 10px 20px;
      border-radius: 6px;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &[type="button"] {
        background: #333;
        color: #fff;

        &:hover {
          background: #444;
        }
      }

      &[type="submit"] {
        background: #4a9eff;
        color: white;

        &:hover {
          background: #3a8eef;
        }
      }
    }
  }
`;

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose, latitude, longitude }) => {
    const [name, setName] = useState('');
    const user = useSelector((state: RootState) => state.user);
    const { sendMessage } = useWebSocket();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user.userId) {
            console.error("User must be logged in to create a room");
            return;
        }

        sendMessage({
            type: MessageType.CREATE_ROOM,
            name,
            latitude,
            longitude,
            userId: user.userId
        });
        
        onClose();
    };

    return (
        <AnimatePresence>
            <ModalOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <ModalContent
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                >
                    <h2>Create New Room</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="roomName">Room Name</label>
                            <input
                                type="text"
                                id="roomName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                maxLength={255}
                                placeholder="Enter room name..."
                                autoFocus
                            />
                        </div>
                        <div className="form-actions">
                            <button type="button" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit">
                                Create Room
                            </button>
                        </div>
                    </form>
                </ModalContent>
            </ModalOverlay>
        </AnimatePresence>
    );
};

export default CreateRoomModal; 