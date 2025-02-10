import { useContext, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthForm from './components/screens/Auth/AuthForm';
import MainApp from './components/screens/Main/MainApp';  // Your main app component
import LoadingSpinner from './components/common/LoadingSpinner';  // Create if needed
import { AuthScreen } from './components/screens/Auth/AuthScreen';
import { setLoading, setToken, setUser, clearUser } from './features/user/UserSlice';
import { PulsatingLogo } from './components/Logo/PulsatingLogo';
import { UserContext } from './context/UserContext';

function App() {
    const isLoading = useAppSelector((state) => state.user.isLoading);
    const user = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();
    useEffect( () => {
        // Check for stored user data on app load
        const validateToken = async () => {
            try {
                dispatch(setLoading(true)); // Start loading state
                const response = await fetch('http://localhost:3312/verify-token', {
                    method: 'GET',
                    credentials: 'include', // Include cookies in the request
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = JSON.parse(localStorage.getItem('user') || '{}');
                    dispatch(setUser({ userId: data.id, username: data.username, email: data.email, latitude: data.latitude, longitude: data.longitude, token: true }))
                } else {
                    // If response is not OK (e.g., 401), clear user state
                    localStorage.removeItem('user');
                    dispatch(clearUser());
                    dispatch(setToken(false));
                }
            } catch (error) {
                console.error('Token validation error:', error);
                dispatch(clearUser()); // Clear the user state if validation fails
                dispatch(setToken(false));
            } finally {
                dispatch(setLoading(false)); // End loading state
            }
        };

        validateToken();
    }, []);

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><PulsatingLogo/></div>;
    }
    // If we have a userId, show the main app, otherwise show auth form
    return (
        <div className="app">
            {user.token ? <MainApp /> : <AuthScreen />}
        </div>
    );
}

export default App; 