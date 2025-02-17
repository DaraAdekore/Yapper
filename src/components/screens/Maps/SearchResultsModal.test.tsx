import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SearchResultsModal } from './SearchResultsModal';
import roomsReducer from '../../../features/rooms/RoomsSlice';

// Create a mock store
const createMockStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            rooms: roomsReducer
        },
        preloadedState: initialState
    });
};

describe('SearchResultsModal', () => {
    const mockOnClose = jest.fn();

    it('renders empty state when no results', () => {
        const store = createMockStore({
            rooms: {
                searchResults: [],
                queryFilter: 'test',
                activeRoomId: null
            }
        });

        render(
            <Provider store={store}>
                <SearchResultsModal onClose={mockOnClose} />
            </Provider>
        );

        expect(screen.getByText('No rooms found')).toBeInTheDocument();
    });

    it('renders search results correctly', () => {
        const store = createMockStore({
            rooms: {
                searchResults: [
                    {
                        id: '1',
                        name: 'Test Room',
                        creatorUsername: 'TestUser',
                        latitude: 0,
                        longitude: 0
                    }
                ],
                queryFilter: 'test',
                activeRoomId: null
            }
        });

        render(
            <Provider store={store}>
                <SearchResultsModal onClose={mockOnClose} />
            </Provider>
        );

        expect(screen.getByText('Test Room')).toBeInTheDocument();
        expect(screen.getByText('Created by: TestUser')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
        const store = createMockStore({
            rooms: {
                searchResults: [],
                queryFilter: '',
                activeRoomId: null
            }
        });

        render(
            <Provider store={store}>
                <SearchResultsModal onClose={mockOnClose} />
            </Provider>
        );

        fireEvent.click(screen.getByRole('button'));
        expect(mockOnClose).toHaveBeenCalled();
    });
}); 