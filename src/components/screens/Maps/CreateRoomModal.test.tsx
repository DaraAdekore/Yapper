import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CreateRoomModal from './CreateRoomModal';
import { WebSocketProvider } from '../../../context/__mocks__/WebSocketContext';

const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            rooms: roomsReducer,
            user: userReducer
        },
        preloadedState: initialState
    });
};

describe('CreateRoomModal', () => {
    it('creates a room when form submitted', async () => {
        const mockOnClose = jest.fn();
        const store = createMockStore({
            user: {
                userId: '123',
                username: 'TestUser'
            }
        });

        render(
            <Provider store={store}>
                <WebSocketProvider>
                    <CreateRoomModal 
                        onClose={mockOnClose}
                        latitude={0}
                        longitude={0}
                    />
                </WebSocketProvider>
            </Provider>
        );

        fireEvent.change(screen.getByPlaceholderText('Room name'), {
            target: { value: 'Test Room' }
        });

        fireEvent.click(screen.getByText('Create'));
        
        // Wait for async operations
        await screen.findByText('Room created successfully');
        expect(mockOnClose).toHaveBeenCalled();
    });
}); 