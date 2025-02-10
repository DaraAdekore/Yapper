import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
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
    activeRoomId?: UUID | null;
    queryFilter: string | null;
    radiusFilter: number | null;
    userId?: UUID | null;
}

const initialState: RoomsState = {
    rooms: [],
    filteredRooms: [],
    queryFilter: null,
    radiusFilter: null,
    activeRoomId: null,
    userId: undefined,
};

interface CreateRoomPayload {
    name: string;
    latitude: number;
    longitude: number;
    creator_id: string;
}

export const createRoom = createAsyncThunk(
    'rooms/createRoom',
    async (roomData: CreateRoomPayload) => {
        const response = await fetch('http://localhost:3312/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roomData),
        });

        if (!response.ok) {
            throw new Error('Failed to create room');
        }

        const data = await response.json();
        return data;
    }
);

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
        addMessage: (state, action: PayloadAction<{ roomId: UUID; message: Message }>) => {
            const room = state.rooms.find(r => r.id === action.payload.roomId);
            if (room) {
                if (!room.messages) {
                    room.messages = [];
                }
                // Check for duplicate messages
                const isDuplicate = room.messages.some(m => m.id === action.payload.message.id);
                if (!isDuplicate) {
                    room.messages.push(action.payload.message);
                }
                
                // Only increment unread if it's not the active room
                if (state.activeRoomId !== room.id) {
                    room.unreadCount = (room.unreadCount || 0) + 1;
                }
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
        addNewRoom: (state, action: PayloadAction<{
            id: UUID;
            name: string;
            latitude: number;
            longitude: number;
            creatorId: string;
            creatorUsername: string;
            isJoined: boolean;
        }>) => {
            const newRoom = {
                ...action.payload,
                unreadCount: 0,
                isNew: true,
                messages: []
            };
            state.rooms.push(newRoom);
            
            // Only set as active room if user is joined
            if (action.payload.isJoined) {
                state.activeRoomId = action.payload.id;
            }
        },
        clearNewRoomFlag: (state, action: PayloadAction<UUID>) => {
            const room = state.rooms.find(r => r.id === action.payload);
            if (room) {
                room.isNew = false;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createRoom.fulfilled, (state, action) => {
                state.rooms.push({
                    ...action.payload,
                    isJoined: true,
                    unreadCount: 0,
                    isNew: false
                });
            });
    }
});

export const { setRooms, addRoom, removeRoom, setActiveRoom, setRoomMessages, addMessage, setFilteredRooms, setQueryFilter, setRadiusFilter, updateRoom, incrementUnread, clearUnread, addNewRoom, clearNewRoomFlag } = roomsSlice.actions;
export default roomsSlice.reducer;
