import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useSpring, animated, to } from "@react-spring/web";
import { useWebSocket } from "../../../context/WebSocketContext";
import "../../../styles/ChatRoom.css";
import { useAppSelector } from "../../../store/hooks";
import { updateRoom, clearUnread, clearNewRoomFlag } from "../../../features/rooms/RoomsSlice";
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

  const groupMessagesByDate = (messages: any[]) => {
    const groups = messages.reduce((groups: MessageGroup[], message) => {
      const date = new Date(message.timestamp).toLocaleDateString();
      const existingGroup = groups.find(group => group.date === date);
      
      if (existingGroup) {
        existingGroup.messages.push(message);
        // Sort messages within group by timestamp
        existingGroup.messages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      } else {
        groups.push({ date, messages: [message] });
      }
      
      return groups;
    }, []);

    // Sort groups by date (oldest first)
    return groups.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const getMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString();
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
    <AnimatedDiv
      className={`chat-room ${showChat ? 'open' : ''}`}
      style={{
        transform: to([x, y], (x, y) => `translate(${x}px, ${y}px)`),
        width: dimensions.width,
        height: dimensions.height,
      }}
    >
      <div 
        className="chat-header"
        onMouseDown={(e) => handleMouseDown(e, 'drag')}
      >
        <div className="chat-header-content">
          <h2>{activeRoom.name}</h2>
        </div>
        <div className="chat-header-buttons">
          {isMember && (
            <button 
              className="leave-button"
              onClick={handleLeaveRoom}
              disabled={isLoading}
            >
              Leave Room
            </button>
          )}
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      </div>

      {!isMember ? (
        <div className="join-prompt">
          <p>Join this room to start chatting!</p>
          <button 
            className="join-button"
            onClick={handleJoinRoom}
            disabled={isLoading}
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      ) : (
        <>
          <div className="messages-container">
            {activeRoom.messages?.length === 0 && (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            {activeRoom.lastActivity && (
              <div className="activity-notification">
                {activeRoom.lastActivity.type === 'join' 
                  ? `${activeRoom.lastActivity.username} joined the room`
                  : `${activeRoom.lastActivity.username} left the room`}
              </div>
            )}
            {activeRoom.messages && groupMessagesByDate(activeRoom.messages).map((group) => (
              <div key={group.date} className="message-group">
                <div className="date-separator">
                  <span>{getMessageDate(group.date)}</span>
                </div>
                {group.messages.map((message) => (
                  <div 
                    key={message.id}
                    className={`message ${message.userId === userId ? 'own-message' : 'other-message'}`}
                  >
                    {message.userId !== userId && (
                      <span className="message-username">{message.username || 'Unknown User'}</span>
                    )}
                    <div className="message-bubble">
                      {message.text}
                    </div>
                    <span className="message-timestamp">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input-container">
            <textarea
              className="message-textarea"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              disabled={!isMember}
              rows={1}
              maxLength={500}
            />
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isMember}
            >
              Send
            </button>
          </div>
        </>
      )}
      <div 
        className="resize-handle"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
    </AnimatedDiv>
  );
};

export default ChatRoom;