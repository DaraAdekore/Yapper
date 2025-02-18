import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageType, Message, WebSocketMessage } from '../Types/Types';
import { updateRoom, addMessage, addRoom, incrementUnread, addNewRoom, setActiveRoom } from '../features/rooms/RoomsSlice';
import { UUID } from 'crypto';
import { stat } from 'fs';
import { RootState } from '../store/store';
import { v4 as uuidv4 } from 'uuid';

// Define the context type
interface WebSocketContextType {
	sendMessage: (message: WebSocketMessage) => void;
	sendChatMessage: (roomId: UUID, content: string) => void;
	joinRoom: (roomId: string, userId: string) => Promise<{ error?: string }>;
	createRoom: (name: string, latitude: number, longitude: number) => void;
	leaveRoom: (roomId: string, userId: string) => Promise<{ error?: string }>;
}

// Create context with default values
export const WebSocketContext = createContext<WebSocketContextType>({
	sendMessage: () => { },
	sendChatMessage: () => { },
	joinRoom: async () => ({ error: 'WebSocket not initialized' }),
	createRoom: () => { },
	leaveRoom: async () => ({ error: 'WebSocket not initialized' })
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const ws = useRef<WebSocket | null>(null);
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.user);
	const activeRoomId = useSelector((state: RootState) => state.rooms.activeRoomId);
	const rooms = useSelector((state: RootState) => state.rooms.rooms);

	// Add a ref to track sent message IDs
	const sentMessageIds = useRef<Set<string>>(new Set());

	const handleMessage = (event: MessageEvent) => {
		const message = JSON.parse(event.data);

		switch (message.type) {
			case MessageType.NEW_MESSAGE:
				if (message.message) {
					// Skip our own messages since we handle them optimistically
					if (message.message.user_id === user.userId) {
						return;
					}

					const room = rooms.find(r => r.id === message.message.room_id);
					if (room) {
						dispatch(addMessage({
							roomId: room.id,
							message: {
								id: message.message.id,
								text: message.message.content,
								userId: message.message.user_id,
								username: message.message.username,
								timestamp: message.message.timestamp
							}
						}));
					}
				}
				break;

			case MessageType.USER_JOINED:
				if (message.roomId && message.userId && message.username) {
					dispatch(updateRoom({
						id: message.roomId,
						lastActivity: {
							type: 'join',
							username: message.username,
							timestamp: new Date().toISOString()
						}
					}));
				}
				break;

			case MessageType.ROOM_CREATED:
				if (message.room) {
					dispatch(addNewRoom({
						id: message.room.id,
						name: message.room.name,
						latitude: message.room.latitude,
						longitude: message.room.longitude,
						creatorId: message.room.creatorId,
						creatorUsername: message.room.creatorUsername
					}));
				}
				break;

			case MessageType.LEAVE_ROOM_CONFIRM:
				if (message.roomId) {
					// Update room's isJoined status
					dispatch(updateRoom({
						id: message.roomId,
						isJoined: false,
						lastActivity: {
							type: 'leave',
							username: user.username || 'Unknown',
							timestamp: new Date().toISOString()
						}
					}));

					// If this is the active room, clear it
					if (activeRoomId === message.roomId) {
						dispatch(setActiveRoom(null));
					}
				}
				break;

			case MessageType.USER_LEFT:
				if (message.roomId && message.userId && message.username) {
					dispatch(updateRoom({
						id: message.roomId,
						lastActivity: {
							type: 'leave',
							username: message.username,
							timestamp: new Date().toISOString()
						}
					}));
				}
				break;

			default:
				console.log('Unhandled message type:', message.type);
		}
	};

	const sendMessage = (message: WebSocketMessage) => {
		if (ws.current?.readyState === WebSocket.OPEN) {
			ws.current.send(JSON.stringify(message));
		}
	};

	const sendChatMessage = (roomId: UUID, content: string) => {
		if (ws.current?.readyState === WebSocket.OPEN && user.userId) {
			const messageId = uuidv4() as UUID;
			const timestamp = new Date().toISOString();

			// Send to server first
			ws.current.send(JSON.stringify({
				type: MessageType.SEND_MESSAGE,
				roomId,
				userId: user.userId,
				content,
				messageId
			}));

			// Then add optimistically
			dispatch(addMessage({
				roomId,
				message: {
					id: messageId,
					text: content,
					userId: user.userId,
					username: user.username || 'You',
					timestamp
				}
			}));
		}
	};

	const joinRoom = (roomId: string, userId: string): Promise<{ error?: string }> => {
		return new Promise((resolve) => {
			if (ws.current?.readyState === WebSocket.OPEN) {
				ws.current.send(JSON.stringify({
					type: MessageType.JOIN_ROOM,
					roomId,
					userId
				}));
				resolve({});
			} else {
				resolve({ error: 'WebSocket not connected' });
			}
		});
	};

	const createRoom = (name: string, latitude: number, longitude: number) => {
		if (ws.current?.readyState === WebSocket.OPEN && user.userId) {
			ws.current.send(JSON.stringify({
				type: MessageType.CREATE_ROOM,
				name,
				latitude,
				longitude,
				userId: user.userId
			}));
		}
	};

	const leaveRoom = (roomId: string, userId: string): Promise<{ error?: string }> => {
		return new Promise((resolve) => {
			if (ws.current?.readyState === WebSocket.OPEN) {
				ws.current.send(JSON.stringify({
					type: MessageType.LEAVE_ROOM,
					roomId,
					userId
				}));
				resolve({});
			} else {
				resolve({ error: 'WebSocket not connected' });
			}
		});
	};

	useEffect(() => {
		if (!user.userId) return;

		ws.current = new WebSocket(process.env.REACT_APP_WS_URL || 'wss://localhost:3312');

		ws.current.onopen = () => {
			console.log('WebSocket connected');
		};

		ws.current.onmessage = handleMessage;

		ws.current.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		return () => {
			ws.current?.close();
		};
	}, [user.userId]);

	const value = {
		sendMessage,
		sendChatMessage,
		joinRoom,
		createRoom,
		leaveRoom
	};

	return (
		<WebSocketContext.Provider value={value}>
			{children}
		</WebSocketContext.Provider>
	);
};

export const useWebSocket = () => {
	const context = useContext(WebSocketContext);
	if (!context) {
		throw new Error('useWebSocket must be used within a WebSocketProvider');
	}
	return context;
};