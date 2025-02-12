import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageType, Message, WebSocketMessage } from '../Types/Types';
import { updateRoom, addMessage, addRoom, incrementUnread, addNewRoom } from '../features/rooms/RoomsSlice';
import { UUID } from 'crypto';
import { stat } from 'fs';
import { useAppSelector } from '../store/hooks';
import { RootState } from '../store/store';

// Define the context type
interface WebSocketContextType {
	sendMessage: (message: WebSocketMessage) => void;
	sendChatMessage: (roomId: UUID, content: string) => void;
	joinRoom: (roomId: string, userId: string) => Promise<{error?: string}>;
	createRoom: (name: string, latitude: number, longitude: number) => void;
}

// Create context with default values
export const WebSocketContext = createContext<WebSocketContextType>({
	sendMessage: () => {},
	sendChatMessage: () => {},
	joinRoom: async () => ({ error: 'WebSocket not initialized' }),
	createRoom: () => {}
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const ws = useRef<WebSocket | null>(null);
	const dispatch = useDispatch();
	const user = useSelector((state: RootState) => state.user);
	const activeRoomId = useSelector((state: RootState) => state.rooms.activeRoomId);

	// Add a ref to track sent message IDs
	const sentMessageIds = useRef<Set<string>>(new Set());

	const handleMessage = (event: MessageEvent) => {
		const message = JSON.parse(event.data);

		switch (message.type) {
			case MessageType.NEW_MESSAGE:
				if (message.message) {
					// Skip if we've already optimistically added this message
					if (sentMessageIds.current.has(message.message.content)) {
						sentMessageIds.current.delete(message.message.content);
						return;
					}
					
					dispatch(addMessage({
						roomId: message.message.room_id,
						message: {
							id: message.message.id,
							text: message.message.content,
							userId: message.message.user_id,
							username: message.message.username,
							timestamp: message.message.timestamp
						}
					}));
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
						creatorUsername: message.room.creatorUsername,
						isJoined: message.room.isJoined
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
			// Track this message content
			sentMessageIds.current.add(content);
			
			const message: Message = {
				type: MessageType.SEND_MESSAGE,
				roomId,
				userId: user.userId,
				content
			};
			console.log('Sending chat message:', message);
			
			// Optimistically add message to UI with proper UUID type
			dispatch(addMessage({
				roomId,
				message: {
					id: crypto.randomUUID() as UUID,  // Cast to UUID type
					text: content,
					userId: user.userId,
					username: user.username || 'You',
					timestamp: new Date().toISOString()
				}
			}));
			
			ws.current.send(JSON.stringify(message));
		}
	};

	const joinRoom = (roomId: string, userId: string): Promise<{error?: string}> => {
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

	useEffect(() => {
		if (!user.userId) return;

		ws.current = new WebSocket('ws://localhost:3312');

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
		createRoom
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