import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/UserSlice";
import roomsReducer from "../features/rooms/RoomsSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    rooms: roomsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
