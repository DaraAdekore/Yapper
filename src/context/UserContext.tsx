import React, { createContext } from 'react';
import { UserState } from '../features/user/UserSlice';
import { useAppSelector } from '../store/hooks';

export const UserContext = createContext<UserState>({
    userId: null,
    username: null,
    email: null,
    latitude: null,
    longitude: null,
    isLoading: null,
    token : null,
    error: null
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const userState = useAppSelector(state => state.user);
    
    return (
        <UserContext.Provider value={userState}>
            {children}
        </UserContext.Provider>
    );
}; 