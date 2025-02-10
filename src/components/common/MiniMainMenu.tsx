import { UUID } from 'crypto';
import React from 'react';
import '../../styles/MiniMainMenu.css'
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveRoom } from '../../features/rooms/RoomsSlice';

interface MiniMainMenuProps {
  onClose: () => void;
}

const MiniMainMenu: React.FC<MiniMainMenuProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const joinedRooms = useAppSelector((state) => state.rooms.rooms.filter((room) => room.isJoined));
  return (
    <div className="mini-main-menu">
      <div className="menu-header">
        <h3>Joined Rooms</h3>
        <button className="close-menu" onClick={onClose}>✖</button>
      </div>
      <ul className="room-list">
        {joinedRooms.map((room) => (
          <li
            key={room.id}
            className="room-item"
            onClick={() => dispatch(setActiveRoom(room.id || null))}
          >
            {room.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MiniMainMenu;