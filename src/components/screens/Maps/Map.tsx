import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { AdvancedMarker, Map, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import Supercluster from 'supercluster';
import type { Marker } from '@googlemaps/markerclusterer';
import { Room } from '../../../Types/Types';
import { setActiveRoom, setRooms, setFilteredRooms } from '../../../features/rooms/RoomsSlice';
import '../../../styles/PulsatingLogo-small-white.css';
import { haversine } from '../../Utilities/Utilities';
import { UUID } from 'crypto';
import ChatRoom from '../Chat/ChatRoom';
import { CircleF } from '@react-google-maps/api';
import '../../../styles/MapIcon.css';
import MiniMainMenu from '../../common/MiniMainMenu';
import { WebSocketProvider } from '../../../context/WebSocketContext'; // Import the WebSocketProvider
import CreateRoomModal from '../../../components/screens/Maps/CreateRoomModal';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';

const MapWithCustomStyle: React.FC = () => {
    const voiceIcon = require('../../../rsrc/icons/voice.png');
    const newRoomIcon = require('../../../rsrc/icons/voice-new.png'); // Add new icon for new rooms
    const user = useSelector((state: RootState) => state.user);
    const rooms = useSelector((state: RootState) => {
        console.log('Current filtered rooms:', state.rooms.filteredRooms);
        return state.rooms.filteredRooms;
    });
    const roomSlice = useSelector((state: RootState) => state.rooms);
    const dispatch = useDispatch();
    const map = useMap();
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const [showMiniMainMenu, setShowMiniMainMenu] = useState(false);
    const activeRoomId = useSelector((state: RootState) => state.rooms.activeRoomId);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLocation, setCreateLocation] = useState<google.maps.LatLngLiteral | null>(null);
    const [clusters, setClusters] = useState<any[]>([]);

    const [pois, setPois] = useState<any[]>([]);

    // Fetch rooms from the server
    const getRooms = async (radius: number | null) => {
        const { latitude, longitude, userId } = user;
        try {
            const response = await fetch("http://localhost:3312/rooms", {
                method: "POST",
                body: JSON.stringify({
                    userLat: latitude,
                    userLng: longitude,
                    radius: radius ?? 5000, // Use 5000 as default if radius is null
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

    // Initialize clusterer when map is ready
    useEffect(() => {
        if (!map) return;

        // Initialize clusterer
        clustererRef.current = new MarkerClusterer({
            map,
            algorithm: new GridAlgorithm({
                gridSize: 60,
                maxZoom: 15
            })
        });

        return () => {
            clustererRef.current?.clearMarkers();
            clustererRef.current = null;
        };
    }, [map]);

    // Update markers when rooms change
    useEffect(() => {
        if (!map || !clustererRef.current) return;

        clustererRef.current.clearMarkers();
        markersRef.current = [];

        const newMarkers = rooms.map(room => {
            const marker = new google.maps.Marker({
                position: { lat: Number(room.latitude), lng: Number(room.longitude) },
                title: room.name,
                label: {
                    text: room.name,
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '500',
                    className: 'marker-label'
                },
                icon: {
                    url: room.isNew ? newRoomIcon : voiceIcon,
                    scaledSize: new google.maps.Size(32, 32),
                    labelOrigin: new google.maps.Point(16, 40)
                }
            });

            marker.addListener('click', () => {
                dispatch(setActiveRoom(room.id));
            });

            return marker;
        });

        clustererRef.current.addMarkers(newMarkers);
        markersRef.current = newMarkers;
    }, [rooms, map]);

    useEffect(() => {
        callGetRooms();
    }, []);

    const callGetRooms = async () => {
        if (user.latitude && user.longitude) {
            // Use 5000 as default radius when radiusFilter is null
            const defaultRadius = roomSlice.radiusFilter ?? 5000;
            await getRooms(defaultRadius);
            dispatch(setFilteredRooms({
                latitude: user.latitude,
                longitude: user.longitude
            }));
        }
    };

    // Add an effect to update filtered rooms when filters change
    useEffect(() => {
        if (user.latitude && user.longitude) {
            dispatch(setFilteredRooms({
                latitude: user.latitude,
                longitude: user.longitude
            }));
        }
    }, [roomSlice.queryFilter, roomSlice.radiusFilter]);

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
                {/* Map component now manages markers through clusterer */}
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

            <style>
                {`
                    .marker-label {
                        background-color: rgba(0, 0, 0, 0.7);
                        padding: 2px 6px;
                        border-radius: 4px;
                        white-space: nowrap;
                        margin-top: 8px;
                        text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    }
                `}
            </style>
        </div>
    );
};

export default MapWithCustomStyle;