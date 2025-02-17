import { UUID } from "crypto"

// export interface User {
//     id: UUID; // Unique identifier for the user
//     roomIds: string[]; // Array of room IDs the user is part of
//     username?: string; // Optional username
//     latitude: number; // User's latitude coordinate
//     longitude: number; // User's longitude coordinate
//     email?: string; // Optional email
//     password?: string; // Optional password
// }

export interface Message {
    type: MessageType;
    roomId?: UUID;
    userId?: UUID;
    content?: string;
    text?: string;
    messageId?: UUID;
    username?: string;
    email?: string;
    password?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
    distance?: number;
    rooms?: Room[];
    isMember?: boolean;
    token?: string;
    message?: {
        id: UUID;
        room_id: UUID;
        user_id: UUID;
        username: string;
        content: string;
        timestamp: string;
    };
    room?: {
        id: UUID;
        name: string;
        latitude: number;
        longitude: number;
        creatorId: UUID;
        creatorUsername: string;
        isJoined: boolean;
    };
    messages?: {
        timestamp: any;
        id: UUID;
        user_id: UUID;
        room_id: UUID | undefined;
        content: string;
    }[];
}

export enum MessageType {
    REGISTER = 'REGISTER',
    REGISTER_SUCCESS = 'REGISTER_SUCCESS',
    REGISTER_ERROR = 'REGISTER_ERROR',
    USER_JOINED = 'USER_JOINED',
    JOIN_ROOM = 'JOIN_ROOM',
    JOIN_ROOM_SUCCESS = 'JOIN_ROOM_SUCCESS',
    LEAVE_ROOM = 'LEAVE_ROOM',
    SEND_MESSAGE = 'SEND_MESSAGE',
    CREATE_ROOM = 'CREATE_ROOM',
    ROOM_CREATED = 'ROOM_CREATED',
    ROOMS_UPDATE = 'ROOMS_UPDATE',
    ERROR = 'ERROR',
    REQUEST_NEARBY_ROOMS = "REQUEST_NEARBY_ROOMS",
    NEARBY_ROOMS = "NEARBY_ROOMS",
    ROOM_MESSAGES = 'ROOM_MESSAGES',
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    LOGOUT_SUCCESS = "LOGOUT_SUCCESS",
    LOGIN_ERROR = "LOGIN_ERROR",
    USER_NOT_FOUND = "USER_NOT_FOUND",
    UPDATE_USERNAME = 'UPDATE_USERNAME',
    USERNAME_UPDATED = 'USERNAME_UPDATED',
    VERIFY_TOKEN = "VERIFY_TOKEN",
    TOKEN_INVALID = "TOKEN_INVALID",
    TOKEN_VALID = "TOKEN_VALID",
    NEW_MESSAGE = "NEW_MESSAGE",
    LOAD_ROOM_MESSAGES = "LOAD_ROOM_MESSAGES", // New message type
    CHECK_MEMBERSHIP = 'CHECK_MEMBERSHIP',
    MEMBERSHIP_STATUS = 'MEMBERSHIP_STATUS',
    USER_LEFT = "USER_LEFT",
	LEAVE_ROOM_CONFIRM = "LEAVE_ROOM_CONFIRM",
}

// Update any other related types if needed
export interface Room {
    id: UUID;
    name: string;
    isJoined: boolean;
    messages?: Message[];
    unreadCount: number;
    isNew?: boolean;
    latitude: number;
    longitude: number;
    creatorId: string;
    creatorUsername: string;
}

export interface ChatMessage {
    id: UUID;
    text: string;
    userId: string;
}

export interface WebSocketMessage {
    type: MessageType;
    roomId?: UUID;
    userId?: UUID;
    content?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
}