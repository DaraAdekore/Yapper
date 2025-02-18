import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useWebSocket } from "../../../context/WebSocketContext";
import "../../../styles/ChatRoom.css";
import { useAppSelector } from "../../../store/hooks";
import { updateRoom, clearUnread, clearNewRoomFlag } from "../../../features/rooms/RoomsSlice";
import { UUID } from "crypto";
import { v4 as uuidv4 } from 'uuid';
import { Message, MessageType, ChatMessage } from "../../../Types/Types";

interface ChatRoomProps {
  onClose: () => void;
}

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
}

const ChatRoom: React.FC<ChatRoomProps> = ({ onClose }) => {
  const { sendChatMessage, leaveRoom } = useWebSocket();
  const dispatch = useDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newMessage, setNewMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(true);

  const activeRoomId = useAppSelector((state) => state.rooms.activeRoomId);
  const activeRoom = useAppSelector((state) => state.rooms.rooms.find((room) => room.id === activeRoomId));
  const userId = useAppSelector((state) => state.user.userId);

  const isMember = activeRoom?.isJoined ?? false;

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
    if (!newMessage.trim() || !isMember || !activeRoomId || !userId) return;

    // Create the optimistic message
    const optimisticMessage = {
      id: uuidv4() as UUID,
      text: newMessage.trim(),
      userId: userId,
      username: 'You',
      timestamp: new Date().toISOString()
    };

    // Add message optimistically to the local state
    if (activeRoom) {
      // Ensure messages array exists and add new message at the end
      const currentMessages = activeRoom.messages || [];
      dispatch(updateRoom({
        id: activeRoom.id,
        messages: [...currentMessages, optimisticMessage] // Add to end without sorting
      }));
    }

    // Send to server
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

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    if (!messages || messages.length === 0) return [];
    
    // Group messages by date, maintaining original order
    const groups = messages.reduce((groups: { [key: string]: ChatMessage[] }, message) => {
        const date = new Date(message.timestamp).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    // Convert to array and maintain chronological order
    return Object.entries(groups)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, messages]) => ({
            date,
            messages // Keep messages in their original order
        }));
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeRoom?.messages]); // Scroll when messages change

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
    <div className={`chat-room ${showChat ? 'open' : ''}`}>
      <div className="chat-header">
        <div className="chat-header-content">
          <h2>{activeRoom?.name}</h2>
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
                    <div className="message-header">
                      <span className="message-username">
                        {message.userId === userId ? 'You' : message.username}
                      </span>
                      <span className="message-timestamp">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="message-bubble">
                      {message.text}
                    </div>
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
    </div>
  );
};

export default ChatRoom;