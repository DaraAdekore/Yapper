import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UUID } from "crypto";
import { haversine } from "../../components/Utilities/Utilities";
import { createAction } from "@reduxjs/toolkit";

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
    rooms: Room[];             // All joined rooms
    filteredRooms: Room[];     // Filtered joined rooms
    searchResults: Room[];     // Search results (separate from joined rooms)
    activeRoomId?: UUID | null;
    queryFilter: string;
    radiusFilter: number | null;
    userId?: UUID | null;
}

const initialState: RoomsState = {
    rooms: [],
    filteredRooms: [],
    searchResults: [],
    queryFilter: '',
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/rooms`, {
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

// Simpler fuzzy search implementation
function fuzzySearch(text: string, pattern: string): boolean {
    if (!text || !pattern) return false;
    console.log(text.toLowerCase().includes(pattern.toLowerCase()));
    return text.toLowerCase().includes(pattern.toLowerCase());
}

// Update the filter function to handle independent filters
function filterRooms(
    rooms: Room[],
    searchQuery: string,
    radius: number | null,
    userLat: number,
    userLng: number
): Room[] {
    return rooms.filter(room => {
        // Text search filter
        const nameMatches = !searchQuery.trim() || 
            room.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (!nameMatches) return false;

        // Radius filter (only if set)
        if (radius !== null) {
            const distance = haversine(
                userLat,
                userLng,
                room.latitude,
                room.longitude
            );
            if (distance > radius) return false;
        }

        return true;
    });
}

interface UpdateRoomPayload {
  id: UUID;
  isJoined?: boolean;
  lastActivity?: {
    type: 'join' | 'leave';
    username: string;
    timestamp: string;
  };
  messages?: {
    id: UUID;
    text: string;
    userId: UUID;
    username: string;
    timestamp: string;
  }[];
}

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
        updateRoom: (state, action: PayloadAction<UpdateRoomPayload>) => {
            const room = state.rooms.find(r => r.id === action.payload.id);
            if (room) {
                if (action.payload.isJoined !== undefined) {
                    room.isJoined = action.payload.isJoined;
                }
                if (action.payload.lastActivity) {
                    room.lastActivity = action.payload.lastActivity;
                }
                if (action.payload.messages) {
                    // Remove duplicates and sort in ascending order
                    const uniqueMessages = Array.from(
                        new Map(action.payload.messages.map(m => [m.id, m])).values()
                    );
                    room.messages = uniqueMessages.sort((a, b) => 
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                }
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
        setFilteredRooms: (state, action: PayloadAction<{ 
            latitude: number; 
            longitude: number;
            rooms?: Room[];
        }>) => {
            // This should only filter joined rooms
            if (action.payload.rooms) {
                state.filteredRooms = action.payload.rooms;
            } else {
                state.filteredRooms = filterRooms(
                    state.rooms,  // Filter from joined rooms
                    state.queryFilter,
                    state.radiusFilter,
                    action.payload.latitude,
                    action.payload.longitude
                );
            }
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
        setQueryFilter: (state, action: PayloadAction<string>) => {
            state.queryFilter = action.payload;
            // Don't update filtered rooms here - let the component handle it
        },
        setRadiusFilter: (state, action: PayloadAction<number | null>) => {
            state.radiusFilter = action.payload;
            // Don't update filtered rooms here - let the component handle it
        },
        addMessage: (state, action: PayloadAction<{ roomId: UUID; message: Message }>) => {
            const room = state.rooms.find(r => r.id === action.payload.roomId);
            if (room) {
                if (!room.messages) {
                    room.messages = [];
                }
        
                // Check for duplicates by ID
                const isDuplicate = room.messages.some(m => m.id === action.payload.message.id);
                if (!isDuplicate) {
                    // Add the new message and sort by timestamp
                    room.messages = [...room.messages, action.payload.message].sort((a, b) =>
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                }
        
                // Increment unread count if the room is not active
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
        }>) => {
            const newRoom = {
                ...action.payload,
                isJoined: true,  // Creator is automatically joined
                unreadCount: 0,
                messages: [],
                isNew: true     // Mark as new
            };
            
            state.rooms.push(newRoom);
            state.filteredRooms.push(newRoom);  // Add to filtered rooms too
            state.activeRoomId = action.payload.id;  // Set as active room
        },
        clearNewRoomFlag: (state, action: PayloadAction<UUID>) => {
            const room = state.rooms.find(r => r.id === action.payload);
            if (room) {
                room.isNew = false;
            }
        },
        setSearchResults: (state, action: PayloadAction<Room[]>) => {
            // Only update search results, don't affect joined rooms
            state.searchResults = action.payload;
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

export const { setRooms, addRoom, removeRoom, setActiveRoom, setRoomMessages, addMessage, setFilteredRooms, setQueryFilter, setRadiusFilter, updateRoom, incrementUnread, clearUnread, addNewRoom, clearNewRoomFlag, setSearchResults } = roomsSlice.actions;
export default roomsSlice.reducer;
