import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useSpring, animated, to } from "@react-spring/web";
import { useWebSocket } from "../../../context/WebSocketContext";
import "../../../styles/ChatRoom.css";
import { useAppSelector } from "../../../store/hooks";
import { updateRoom, clearUnread, clearNewRoomFlag, joinRoom } from "../../../features/rooms/RoomsSlice";
import { UUID } from "crypto";

interface ChatRoomProps {
  onClose: () => void;
}

interface MessageGroup {
  date: string;
  messages: {
  id: UUID;
  text: string;
    userId: UUID;
    username?: string;
    timestamp: any;
  }[];
}

const AnimatedDiv = animated('div');

const ChatRoom: React.FC<ChatRoomProps> = ({ onClose }) => {
  const { sendChatMessage, leaveRoom } = useWebSocket();
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState<string>("");
  const activeRoomId = useAppSelector((state) => state.rooms.activeRoomId);
  const activeRoom = useAppSelector((state) => state.rooms.rooms.find((room) => room.id === activeRoomId));
  const userId = useAppSelector((state) => state.user.userId);

  const isMember = activeRoom?.isJoined ?? false;

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isMember || !activeRoomId || !userId) return;
    sendChatMessage(activeRoomId, newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeRoom?.messages]);

  if (!activeRoomId || !activeRoom) {
    return null;
  }

  return (
    <div className={`chat-room ${isMember ? 'open' : ''}`}>
      <div className="chat-header">
        <h2>{activeRoom.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      {!isMember ? (
        <div className="join-prompt">
          <p>Join this room to start chatting!</p>
          <button onClick={() => {
            if (activeRoomId && userId) {
              dispatch(joinRoom({ roomId: activeRoomId, userId }));
            }
          }}>Join Room</button>
        </div>
      ) : (
        <>
          <div className="messages-container">
            {activeRoom.messages && activeRoom.messages.map((message) => (
              <div key={message.id} className={`message ${message.userId === userId ? 'own-message' : 'other-message'}`}>
                <div className="message-bubble">
                  <span className="message-username">{message.username || 'Unknown User'}</span>
                  <span className="message-content">{message.text}</span>
                  <span className="message-timestamp">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              maxLength={500}
            />
            <button onClick={handleSendMessage} disabled={!newMessage.trim()}>Send</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatRoom;