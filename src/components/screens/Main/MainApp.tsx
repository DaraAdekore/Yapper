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
    const [searchQuery, setSearchQuery] = useState("");
    const [radius, setRadius] = useState(0);
    const user = useAppSelector((state) => state.user);
    const roomsSlice = useAppSelector((state) => state.rooms);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setRadiusFilter(radius))
    }, [radius])
    useEffect(() => {
        dispatch(setQueryFilter(searchQuery))
    }, [searchQuery])
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
                        alignItems: 'center'
                    }}
                >
                    <Navbar.Brand>
                        <PulsatingLogoSmallWhite />
                    </Navbar.Brand>
                    <SearchBarWithRadius searchQuery={searchQuery} setQuery={setSearchQuery} radius={radius} setRadius={setRadius} />
                    
                    {/* Ensure Logout is aligned to the right */}
                    <div style={{ marginLeft: 'auto' }}>
                        <div style={{ color: 'white', paddingRight: '10px' }}>Logged in as {user.username}</div>
                        <Logout />
                    </div>
                </Container>
            </Navbar>
            <ApiProvider />
        </div>
    );
};

export default MainApp; 