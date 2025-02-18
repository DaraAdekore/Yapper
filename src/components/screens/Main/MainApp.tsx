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
        <div style={{ 
            overscrollBehavior: 'contain', 
            overflow: 'hidden', 
            maxHeight: "100vh",
            position: 'relative'
        }}>
            <Navbar
                className="bg-body-tertiary"
                style={{ 
                    backgroundColor: '#0078ff',
                    position: 'relative',
                    zIndex: 9998
                }}
            >
                <Container
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'relative',
                        width: '100%'
                    }}
                >
                    <Navbar.Brand>
                        <PulsatingLogoSmallWhite />
                    </Navbar.Brand>
                    
                    <div style={{ 
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <SearchBarWithRadius />
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <div style={{ color: 'white', paddingRight: '10px' }}>
                            Logged in as {user.username}
                        </div>
                        <Logout />
                    </div>
                </Container>
            </Navbar>

            {!showMiniMainMenu && (
                <button 
                    onClick={() => setShowMiniMainMenu(true)}
                    style={{
                        position: 'fixed',
                        left: '20px',
                        top: '80px',
                        padding: '10px 20px',
                        background: 'rgba(0, 120, 255, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        transition: 'all 0.2s ease',
                        backdropFilter: 'blur(5px)',
                        fontSize: '14px',
                        fontWeight: 500,
                        zIndex: 9999
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                    }}
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