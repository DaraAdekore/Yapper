import React, { useEffect, useState } from 'react';
import { Button, Container, Form, Navbar } from 'react-bootstrap';
import { PulsatingLogoSmallWhite } from '../../Logo/PulsatingLogoSmallWhite';
import { Logout } from '../../common/Logout';
import { useAppSelector } from '../../../store/hooks';
import SearchBarWithRadius from '../../common/SearchBarWithRadius';
import ApiProvider from '../Maps/ApiProvider';
import { useDispatch } from 'react-redux';
import { setQueryFilter, setRadiusFilter } from '../../../features/rooms/RoomsSlice';
const MainApp: React.FC = () => {
    const user = useAppSelector((state) => state.user);
    const roomsSlice = useAppSelector((state) => state.rooms);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setRadiusFilter(null))
    }, [])
    useEffect(() => {
        dispatch(setQueryFilter(""))
    }, [])

    return (
        <div style={{ overscrollBehavior: 'contain', overflow: 'hidden', maxHeight: "100vh" }}>
            <Navbar
                className="bg-body-tertiary"
                style={{ backgroundColor: '#0078ff' }}
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
            <ApiProvider />
        </div>
    );
};

export default MainApp; 