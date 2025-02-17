import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setQueryFilter, setRadiusFilter, setFilteredRooms, setSearchResults } from '../../features/rooms/RoomsSlice';
import { Button } from 'react-bootstrap';
import { SearchResultsModal } from '../screens/Maps/SearchResultsModal';
import '../../styles/SearchBar.css';

export default function SearchBarWithRadius() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        dispatch(setQueryFilter(value));
        applyFilters();
    };

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' || e.target.value === '0' ? null : parseInt(e.target.value);
        setRadius(value);
        dispatch(setRadiusFilter(value));
        applyFilters();
    };

    const applyFilters = () => {
        if (!user.latitude || !user.longitude) return;
        dispatch(setFilteredRooms({
            latitude: user.latitude,
            longitude: user.longitude
        }));
    };

    const fetchSearchResults = async (searchTerm: string, searchRadius: number | null) => {
        if (!user.userId) return;

        try {
            setIsSearching(true);
            const params = new URLSearchParams({
                userId: user.userId,
                ...(searchTerm && { searchTerm }),
                ...(searchRadius && { radius: searchRadius.toString() })
            });

            const response = await fetch(`${process.env.REACT_APP_API_URL}:${process.env.PORT}/api/search-rooms?${params}`);
            
            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            // Transform snake_case to camelCase
            const transformedRooms = data.rooms.map((room: any) => ({
                id: room.id,
                name: room.name,
                latitude: room.latitude,
                longitude: room.longitude,
                creatorId: room.creator_id,
                creatorUsername: room.creator_username,  // Map from creator_username
                isJoined: false,
                unreadCount: 0,
                messages: []
            }));
            
            dispatch(setSearchResults(transformedRooms));
            setShowResults(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchClick = async () => {
        if (!user.userId) return;

        try {
            await fetchSearchResults(searchQuery, radius);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    useEffect(() => {
        applyFilters();
    }, [user.latitude, user.longitude]);

    return (
        <>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="search-input"
                />
                <input
                    type="number"
                    value={radius ?? ''}
                    onChange={handleRadiusChange}
                    className="radius-input"
                    min="1"
                    max="5000"
                    step="100"
                    placeholder="No radius filter"
                />
                <span className="radius-label">KM</span>
                <Button 
                    onClick={handleSearchClick}
                    className="search-button"
                >
                    Search
                </Button>
            </div>
            
            {showResults && (
                <SearchResultsModal 
                    onClose={() => setShowResults(false)}
                />
            )}
        </>
    );
}