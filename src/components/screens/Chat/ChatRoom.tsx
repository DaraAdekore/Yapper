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

  const [{ x, y }, api] = useSpring(() => ({ x: 35, y: 35 }));
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newMessage, setNewMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);
  
  const activeRoomId = useAppSelector((state) => state.rooms.activeRoomId);
  const activeRoom = useAppSelector((state) => state.rooms.rooms.find((room) => room.id === activeRoomId));
  const userId = useAppSelector((state) => state.user.userId);

  const isMember = activeRoom?.isJoined ?? false;

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    if (type === 'drag') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - x.get(), y: e.clientY - y.get() });
    } else {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      api.start({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
        immediate: true
      });
    } else if (isResizing) {
      const newWidth = Math.max(300, Math.min(800, dimensions.width + (e.clientX - dragStart.x)));
      const newHeight = Math.max(400, Math.min(800, dimensions.height + (e.clientY - dragStart.y)));
      setDimensions({ width: newWidth, height: newHeight });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  const handleJoinRoom = async () => {
    if (!activeRoomId || !userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roomId: activeRoomId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to join room');
      }
      
      const roomData = await response.json();
      dispatch(updateRoom(roomData));
      
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    console.log(!newMessage.trim(), !isMember, !activeRoomId, !userId);
    if (!newMessage.trim() || !isMember || !activeRoomId || !userId) return;
    sendChatMessage(activeRoomId, newMessage.trim());
    setNewMessage("");
  };

  useEffect(() => {
    if (!activeRoomId) return;
    setIsLoading(false);
    setShowChat(true);
  }, [activeRoomId]);

  useEffect(() => {
    if (activeRoomId) {
      dispatch(clearUnread(activeRoomId));
      dispatch(clearNewRoomFlag(activeRoomId));
    }
  }, [activeRoomId, dispatch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll when messages load or new message arrives
  useEffect(() => {
    scrollToBottom();
  }, [activeRoom?.messages]);

  // Scroll when room first opens
  useEffect(() => {
    if (activeRoomId) {
      setTimeout(scrollToBottom, 100); // Small delay to ensure content is rendered
    }
  }, [activeRoomId]);

  const handleLeaveRoom = async () => {
    if (!activeRoomId || !userId) return;
    
    setIsLoading(true);
    try {
      await leaveRoom(activeRoomId, userId);
      onClose(); // Close the chat window after leaving
    } catch (error) {
      console.error('Error leaving room:', error);
    } finally {
      setIsLoading(false);
    }
  };

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