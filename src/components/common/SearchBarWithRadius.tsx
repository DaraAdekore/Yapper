import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setQueryFilter, setRadiusFilter, setFilteredRooms } from '../../features/rooms/RoomsSlice';
import { Button } from 'react-bootstrap';
import { SearchResultsModal } from '../screens/Maps/SearchResultsModal';
import '../../styles/SearchBar.css';

export default function SearchBarWithRadius() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState<number | null>(null);
    const [showResults, setShowResults] = useState(false);

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

    const handleSearchClick = async () => {
        if (!user.userId) return;

        try {
            const params = new URLSearchParams({
                userId: user.userId,
                ...(searchQuery && { searchTerm: searchQuery }),
                ...(radius && { radius: radius.toString() })
            });

            const response = await fetch(`http://localhost:3312/api/search-rooms?${params}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Search results:', data); // Debug log
                dispatch(setFilteredRooms({
                    latitude: user.latitude!,
                    longitude: user.longitude!,
                    rooms: data.rooms // Pass the rooms from the API
                }));
                setShowResults(true);
            }
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