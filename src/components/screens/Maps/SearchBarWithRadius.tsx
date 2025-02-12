import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setQueryFilter, setRadiusFilter, setFilteredRooms } from '../../../features/rooms/RoomsSlice';
import '../../../styles/SearchBar.css';

export default function SearchBarWithRadius() {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.user);
    const [searchQuery, setSearchQuery] = useState('');
    const [radius, setRadius] = useState<number | null>(null);

    // Function to update filters and trigger filtering
    const applyFilters = () => {
        if (!user.latitude || !user.longitude) return;

        dispatch(setQueryFilter(searchQuery));
        dispatch(setRadiusFilter(radius));
        dispatch(setFilteredRooms({
            latitude: user.latitude,
            longitude: user.longitude
        }));
    };

    // Handle search input changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        // Immediate update for search
        setTimeout(() => {
            dispatch(setQueryFilter(value));
            applyFilters();
        }, 0);
    };

    // Handle radius changes
    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // If input is empty or 0, set to null
        const value = e.target.value === '' || e.target.value === '0' ? null : parseInt(e.target.value);
        setRadius(value);
        dispatch(setRadiusFilter(value));
        applyFilters();
    };

    return (
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
                value={radius ?? ''} // This ensures empty string when null
                onChange={handleRadiusChange}
                className="radius-input"
                min="1"
                max="5000"
                step="100"
                placeholder="No radius filter"
            />
            <span className="radius-label">m</span>
        </div>
    );
} 