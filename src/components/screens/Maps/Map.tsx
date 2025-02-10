import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { AdvancedMarker, Map, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import Supercluster from 'supercluster';
import type { Marker } from '@googlemaps/markerclusterer';
import { Room } from '../../../Types/Types';
import { setActiveRoom, setRooms } from '../../../features/rooms/RoomsSlice';
import '../../../styles/PulsatingLogo-small-white.css';
import { haversine } from '../../Utilities/Utilities';
import { UUID } from 'crypto';
import ChatRoom from '../Chat/ChatRoom';
import { CircleF } from '@react-google-maps/api';
import '../../../styles/MapIcon.css';
import MiniMainMenu from '../../common/MiniMainMenu';
import { WebSocketProvider } from '../../../context/WebSocketContext'; // Import the WebSocketProvider
import CreateRoomModal from '../../../components/screens/Maps/CreateRoomModal';

const MapWithCustomStyle: React.FC = () => {
    const voiceIcon = require('../../../rsrc/icons/voice.png');
    const newRoomIcon = require('../../../rsrc/icons/voice-new.png'); // Add new icon for new rooms
    const user = useAppSelector((state) => state.user);
    const rooms = useAppSelector((state) => state.rooms.rooms);
    const roomSlice = useAppSelector((state) => state.rooms);
    const dispatch = useAppDispatch();
    const map = useMap();
    const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
    const [showMiniMainMenu, setShowMiniMainMenu] = useState(false);
    const activeRoomId = useAppSelector((state) => state.rooms.activeRoomId);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLocation, setCreateLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [clusters, setClusters] = useState<any[]>([]);

    const [pois, setPois] = useState<any[]>([]);

    // Fetch rooms from the server
    const getRooms = async (radius: number) => {
        const { latitude, longitude, userId } = user;
        try {
            const response = await fetch("http://localhost:3312/rooms", {
                method: "POST",
                body: JSON.stringify({
                    userLat: latitude,
                    userLng: longitude,
                    radius: radius,
                    userId: userId
                }),
                headers: { "Content-Type": "application/json" }
            });
            if (response.ok) {
                const rooms = await response.json();
                dispatch(setRooms(rooms));
            }
        } catch (error) {
            console.error("Fetch rooms error:", error);
        }
    };

    // Fetch joined rooms when the component mounts
    // const fetchJoinedRooms = async () => {
    //     if (!user?.userId) {
    //         console.error("Error: userId is null or undefined");
    //         return;
    //     }
    //     try {
    //         const response = await fetch("http://localhost:3312/joined-rooms", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ userId: user.userId })
    //         });

    //         if (!response.ok) {
    //             throw new Error("Failed to fetch joined rooms");
    //         }

    //         const data = await response.json();
    //         setJoinedRooms(data);
    //     } catch (error) {
    //         console.error("Error fetching joined rooms:", error);
    //     }
    // };

    // Initialize clusterer when map is ready
    useEffect(() => {
        if (!map) return;
        
        // Group markers that are close together
        const points = pois.map(poi => ({
            ...poi,
            location: new google.maps.LatLng(poi.location.lat, poi.location.lng)
        }));

        // Simple clustering based on distance
        const zoom = map.getZoom() || 15;
        const threshold = 100 / Math.pow(2, zoom); // Adjust threshold based on zoom

        setClusters(points);
    }, [pois, map]);

    useEffect(() => {
        callGetRooms();
        // fetchJoinedRooms();
    }, []);

    // Filter and map rooms to POIs
    useEffect(() => {
        if (!rooms) return;
        const radiusFilteredRooms = rooms.filter((room) => {
            if (!roomSlice.radiusFilter) return false;
            return haversine(user.latitude || 0, user.longitude || 0, room.latitude || 0, room.longitude || 0) <= roomSlice.radiusFilter;
        });

        const filteredRooms = radiusFilteredRooms.filter((room) => {
            if (!roomSlice.queryFilter || roomSlice.queryFilter.trim() === "") return true;
            return room.name?.toLowerCase().includes(roomSlice.queryFilter.toLowerCase());
        });

        setPois(filteredRooms.map((room) => ({
            key: room.id,
            name: room.name,
            location: { lat: parseFloat(`${room.latitude}`), lng: parseFloat(`${room.longitude}`) },
            isNew: false,
            unreadCount: 0
        })));
    }, [roomSlice.radiusFilter, roomSlice.queryFilter, rooms]);

    const callGetRooms = async () => {
        await getRooms(roomSlice.radiusFilter || 1000);
    };
    function closeChat(): void {
        dispatch(setActiveRoom(null));
    }

    const handleMapClick = (event: MapMouseEvent) => {
        if (!user.userId) {
            console.error("User must be logged in to create a room");
            return;
        }
        
        if (!event.detail?.latLng) {
            console.error("Invalid click location");
            return;
        }

        setCreateLocation({
            lat: event.detail.latLng.lat,
            lng: event.detail.latLng.lng
        });
        setShowCreateModal(true);
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', position: 'relative' }}>
            <Map
                style={{ width: '100%', height: '100%', overflow: 'hidden' }}
                defaultZoom={17}
                disableDefaultUI={true}
                mapId="3f4e65c4b765243e"
                defaultCenter={{ lat: parseFloat(`${user.latitude}`), lng: parseFloat(`${user.longitude}`) }}
                scaleControl={true}
                onClick={handleMapClick}
                clickableIcons={true}
                reuseMaps={true}
            >
                {clusters.map((poi) => (
                    <AdvancedMarker
                        key={poi.key}
                        position={poi.location}
                        onClick={() => dispatch(setActiveRoom(poi.key as UUID))}
                    >
                        <div className="marker-container">
                            <img
                                src={poi.isNew ? newRoomIcon : voiceIcon}
                                width="32px"
                                height="32px"
                                className={`pulsating-logo-small-white ${poi.isNew ? 'new-room' : ''}`}
                            />
                            <span className="marker-label">
                                {poi.name}
                                {poi.unreadCount > 0 && (
                                    <span className="unread-badge">{poi.unreadCount}</span>
                                )}
                            </span>
                        </div>
                    </AdvancedMarker>
                ))}
            </Map>

            {/* ChatRoom Sidebar */}
            {(activeRoomId && user.userId) && (
                <div className={`chatroom-container ${activeRoomId ? 'open' : ''}`}>
                    <ChatRoom
                        onClose={closeChat}
                    />
                </div>
            )}

            {/* Mini Main Menu */}
            {showMiniMainMenu && (
                <MiniMainMenu
                    onClose={() => setShowMiniMainMenu(false)}
                />
            )}

            {/* Create Room Modal */}
            {showCreateModal && createLocation && (
                <CreateRoomModal
                    onClose={() => setShowCreateModal(false)}
                    latitude={createLocation.lat}
                    longitude={createLocation.lng}
                />
            )}

            {/* Button to toggle Mini Main Menu */}
            {!showMiniMainMenu && (
                <button className="toggle-menu-button" onClick={() => setShowMiniMainMenu(true)}>
                    {'Joined rooms'}
                </button>
            )}
        </div>
    );
};

export default MapWithCustomStyle;