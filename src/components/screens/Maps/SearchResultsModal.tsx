import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { setActiveRoom } from '../../../features/rooms/RoomsSlice';
import '../../../styles/SearchResultsModal.css';
import { UUID } from 'crypto';

interface SearchResultsModalProps {
    onClose: () => void;
}

export const SearchResultsModal: React.FC<SearchResultsModalProps> = ({ onClose }) => {
    const dispatch = useDispatch();
    const searchResults = useSelector((state: RootState) => state.rooms.searchResults);
    const searchQuery = useSelector((state: RootState) => state.rooms.queryFilter);
    const activeRoomId = useSelector((state: RootState) => state.rooms.activeRoomId);

    const handleRoomClick = (roomId: UUID) => {
        dispatch(setActiveRoom(roomId));
        onClose(); // Close modal after selection
    };

    return (
        <div className={`search-results-modal ${activeRoomId ? 'with-chat' : ''}`}>
            <div className="search-results-header">
                <h3>Search Results {searchQuery && `for "${searchQuery}"`}</h3>
                <button onClick={onClose}>&times;</button>
            </div>
            <div className="search-results-content">
                {searchResults.length === 0 ? (
                    <p>No rooms found</p>
                ) : (
                    <ul>
                        {searchResults.map(room => (
                            <li 
                                key={room.id} 
                                className="room-result"
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <h4>{room.name}</h4>
                                <p>Created by: {room.creatorUsername}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}; 