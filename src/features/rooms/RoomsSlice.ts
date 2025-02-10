import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UUID } from "crypto";
import { haversine } from "../../components/Utilities/Utilities";

interface Message {
    id: UUID;
    text: string;
    userId: UUID;
    username: string;
    timestamp: string;
}

interface Room {
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
    lastActivity?: {
        type: 'join' | 'leave';
        username: string;
        timestamp: string;
    };
}

interface RoomsState {
    rooms: Room[];
    filteredRooms: Room[];
    activeRoomId?: UUID | null; // Tracks the currently active room
    queryFilter: string | null;
    radiusFilter: number | null;
}

const initialState: RoomsState = {
    rooms: [],
    filteredRooms: [],
    queryFilter: null,
    radiusFilter: null,
    activeRoomId: null,
};

const roomsSlice = createSlice({
    name: "rooms",
    initialState,
    reducers: {
        // In roomsSlice reducers
        setRooms: (state, action: PayloadAction<Room[]>) => {
            state.rooms = action.payload.map(room => ({
                ...room,
                isJoined: room.isJoined || false
            }));
        },
        updateRoom: (state, action: PayloadAction<Partial<Room>>) => {
            const index = state.rooms.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.rooms[index] = {
                    ...state.rooms[index],
                    ...action.payload
                };
            }
        },
        addRoom: (state, action: PayloadAction<Room>) => {
            state.rooms.push(action.payload);
        },
        removeRoom: (state, action: PayloadAction<UUID>) => {
            state.rooms = state.rooms.filter((room) => room.id !== action.payload);
        },
        setActiveRoom: (state, action: PayloadAction<UUID | null>) => {
            state.activeRoomId = action.payload;
        },
        setFilteredRooms: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
            const { latitude: userLatitude, longitude: userLongitude } = action.payload;
            let filteredRooms = state.rooms;

            // Apply query filter if it exists
            if (state.queryFilter) {
                const searchTerms = state.queryFilter.split(",").map(term => term.trim().toLowerCase());
                filteredRooms = filteredRooms.filter(room =>
                    room.name?.toLowerCase() &&
                    searchTerms.some(term => room.name?.toLowerCase().includes(term))
                );
            }

            // Apply radius filter if it exists
            if (state.radiusFilter !== null) {
                filteredRooms = filteredRooms.filter(room =>
                    room.latitude !== undefined &&
                    room.longitude !== undefined &&
                    haversine(
                        userLatitude,
                        userLongitude,
                        room.latitude,
                        room.longitude
                    ) < (state.radiusFilter || 5000)
                );
            }

            // Update the filteredRooms state
            state.filteredRooms = filteredRooms;
        },

        setRoomMessages: (state, action: PayloadAction<{ 
            roomId: UUID; 
            messages: { 
                id: UUID; 
                text: string; 
                userId: UUID; 
                username: string; 
                timestamp: any; 
            }[] | undefined 
        }>) => {
            const room = state.rooms.find((room) => room.id === action.payload.roomId);
            if (room) {
                room.messages = action.payload.messages;
            }
        },
        setRadiusFilter: (state, action: PayloadAction<number>) => {
            state.radiusFilter = action.payload;
        },
        setQueryFilter: (state, action: PayloadAction<string>) => {
            state.queryFilter = action.payload;
        },
        addMessage: (state, action: PayloadAction<{
            roomId: UUID;
            message: {
                id: UUID;
                text: string;
                userId: UUID;
                username: string;
                timestamp: any;
            };
        }>) => {
            const room = state.rooms.find(r => r.id === action.payload.roomId);
            if (room && room.messages) {
                room.messages.push(action.payload.message);
            }
        },
        incrementUnread: (state, action: PayloadAction<UUID>) => {
            const room = state.rooms.find(r => r.id === action.payload);
            if (room && room.id !== state.activeRoomId) {
                room.unreadCount = (room.unreadCount || 0) + 1;
            }
        },
        clearUnread: (state, action: PayloadAction<UUID>) => {
            const room = state.rooms.find(r => r.id === action.payload);
            if (room) {
                room.unreadCount = 0;
            }
        },
        addNewRoom: (state, action: PayloadAction<Room>) => {
            const room = {
                ...action.payload,
                isNew: true,
                unreadCount: 0
            };
            state.rooms.push(room);
        },
        clearNewRoomFlag: (state, action: PayloadAction<UUID>) => {
            const room = state.rooms.find(r => r.id === action.payload);
            if (room) {
                room.isNew = false;
            }
        }
    },
});

export const { setRooms, addRoom, removeRoom, setActiveRoom, setRoomMessages, addMessage, setFilteredRooms, setQueryFilter, setRadiusFilter, updateRoom, incrementUnread, clearUnread, addNewRoom, clearNewRoomFlag } = roomsSlice.actions;
export default roomsSlice.reducer;
