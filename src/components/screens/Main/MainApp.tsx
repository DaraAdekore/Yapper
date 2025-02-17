import React, { useEffect, useState } from 'react';
import { Button, Container, Form, Navbar } from 'react-bootstrap';
import { PulsatingLogoSmallWhite } from '../../Logo/PulsatingLogoSmallWhite';
import { Logout } from '../../common/Logout';
import { useAppSelector } from '../../../store/hooks';
import SearchBarWithRadius from '../../common/SearchBarWithRadius';
import ApiProvider from '../Maps/ApiProvider';
import { useDispatch } from 'react-redux';
import { setQueryFilter, setRadiusFilter } from '../../../features/rooms/RoomsSlice';
import MiniMainMenu from '../../common/MiniMainMenu';
import NavbarComponent from '../../common/Navbar';
import '../../../styles/MainApp.css';

const MainApp: React.FC = () => {
    const user = useAppSelector((state) => state.user);
    const roomsSlice = useAppSelector((state) => state.rooms);
    const dispatch = useDispatch();
    const [showMiniMainMenu, setShowMiniMainMenu] = useState(false);

    useEffect(() => {
        dispatch(setRadiusFilter(null))
    }, [])
    useEffect(() => {
        dispatch(setQueryFilter(""))
    }, [])

    return (
        <div className="main-app">
            <NavbarComponent />
            {!showMiniMainMenu && (
                <button 
                    onClick={() => setShowMiniMainMenu(true)}
                    className="joined-rooms-button"
                >
                    Joined Rooms
                </button>
            )}

            <div style={{ position: 'relative' }}>
                <ApiProvider />
            </div>
            
            {showMiniMainMenu && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    left: '20px',
                    zIndex: 10000
                }}>
                    <MiniMainMenu onClose={() => setShowMiniMainMenu(false)} />
                </div>
            )}
        </div>
    );
};

export default MainApp; 