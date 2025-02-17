import React from 'react';
import { Card } from 'react-bootstrap';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveRoom } from '../../features/rooms/RoomsSlice';

interface MiniMainMenuProps {
    onClose: () => void;
}

const MiniMainMenu: React.FC<MiniMainMenuProps> = ({ onClose }) => {
    const dispatch = useAppDispatch();
    const rooms = useAppSelector(state => state.rooms.rooms);
    const joinedRooms = rooms.filter(room => room.isJoined);

    return (
        <Card style={{
            position: 'absolute',
            width: '300px',
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            zIndex: 10000
        }}>
            <Card.Header 
                style={{
                    padding: '16px',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <h5 style={{ margin: 0, fontWeight: 600 }}>Joined Rooms</h5>
                <button 
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '4px 12px',
                        color: '#666',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease',
                        marginRight: 'auto'
                    }}
                >
                    ×
                </button>
            </Card.Header>
            <Card.Body style={{ 
                overflowY: 'auto', 
                padding: '12px',
                maxHeight: '400px'
            }}>
                {joinedRooms.map(room => (
                    <div
                        key={room.id}
                        onClick={() => dispatch(setActiveRoom(room.id))}
                        style={{
                            padding: '12px 16px',
                            marginBottom: '8px',
                            background: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                            border: '1px solid rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                        }}
                    >
                        {room.name}
                    </div>
                ))}
            </Card.Body>
        </Card>
    );
};

export default MiniMainMenu;