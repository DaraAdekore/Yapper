import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { MessageType, Message } from '../Types/Types';
import { updateRoom, addMessage, addRoom, incrementUnread, addNewRoom } from '../features/rooms/RoomsSlice';
import { UUID } from 'crypto';
import { stat } from 'fs';
import { useAppSelector } from '../store/hooks';

interface WebSocketContextType {
	sendChatMessage: (roomId: UUID, content: string) => void;
	joinRoom: (roomId: string, userId: string) => void;
	createRoom: (name: string, latitude: number, longitude: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const ws = useRef<WebSocket | null>(null);
	const dispatch = useDispatch();
    const user = useAppSelector((state) => state.user);
	useEffect(() => {
		ws.current = new WebSocket(process.env.REACT_APP_WS_URL || '');

		ws.current.onopen = () => {
			console.log('WebSocket Connected');
		};

		ws.current.onmessage = (event) => {
			const message: Message = JSON.parse(event.data);

			switch (message.type) {
				case MessageType.NEW_MESSAGE:
					if (message.message) {
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
						dispatch(incrementUnread(message.message.room_id));
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
							isJoined: false,
							unreadCount: 0,
							isNew: true
						}));
					}
					break;

				default:
					console.log('Unhandled message type:', message.type);
			}
		};

		ws.current.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		ws.current.onclose = () => {
			console.log('WebSocket disconnected');
		};

		return () => {
			if (ws.current) {
				ws.current.close();
			}
		};
	}, [dispatch]);

	const sendChatMessage = (roomId: UUID, content: string) => {
		if (ws.current?.readyState === WebSocket.OPEN && user.userId) {
			const localMessage = {
				id: crypto.randomUUID() as UUID,
				text: content,
				userId: user.userId,
				username: user.username || 'Anonymous',
				timestamp: new Date().toISOString()
			};

			dispatch(addMessage({
				roomId,
				message: localMessage
			}));

			ws.current.send(JSON.stringify({
				type: MessageType.SEND_MESSAGE,
				roomId,
				userId: user.userId,
				content,
			}));
		}
	};

	const joinRoom = (roomId: string, userId: string) => {
		if (ws.current?.readyState === WebSocket.OPEN) {
			ws.current.send(JSON.stringify({
				type: MessageType.JOIN_ROOM,
				roomId,
				userId
			}));
		}
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

	const value = {
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
	if (context === undefined) {
		throw new Error('useWebSocket must be used within a WebSocketProvider');
	}
	return context;
};