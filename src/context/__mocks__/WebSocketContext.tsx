import React from 'react';

export const WebSocketContext = React.createContext({
    sendMessage: jest.fn(),
    sendChatMessage: jest.fn(),
    joinRoom: jest.fn(),
    createRoom: jest.fn(),
    leaveRoom: jest.fn()
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mockValue = {
        sendMessage: jest.fn(),
        sendChatMessage: jest.fn(),
        joinRoom: jest.fn().mockResolvedValue({}),
        createRoom: jest.fn(),
        leaveRoom: jest.fn().mockResolvedValue({})
    };

    return (
        <WebSocketContext.Provider value={mockValue}>
            {children}
        </WebSocketContext.Provider>
    );
}; 