import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../features/user/UserSlice';
import roomsReducer from '../features/rooms/RoomsSlice';
// Import other reducers as needed

export const store = configureStore({
  reducer: {
    user: userReducer,
    rooms: roomsReducer,
    // Add other reducers here
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 