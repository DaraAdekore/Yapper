import { createAsyncThunk } from '@reduxjs/toolkit';

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