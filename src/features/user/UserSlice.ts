import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UUID } from "crypto";

export interface UserState {
    userId: UUID | null;
    username: string | null;
    email: string | null;
    latitude: number | null;
    longitude: number | null;
    token: boolean | null;
    error: string | null;
    isLoading: boolean | null;
}

const initialState: UserState = {
    userId: null,
    username: null,
    email: null,
    latitude: null,
    longitude: null,
    isLoading: null,
    token: null,
    error: null,
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<Partial<UserState>>) => {
            return { ...state, ...action.payload };
        },
        clearUser: (state) => {
            return initialState;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setToken: (state, action: PayloadAction<boolean>) => {
            state.token = action.payload;
        },
    },
});

export const { setUser, clearUser, setToken , setLoading} = userSlice.actions;
export default userSlice.reducer;