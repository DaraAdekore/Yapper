import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWrapper from './App';
import { UserProvider } from './context/UserContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Provider } from 'react-redux';
import { store } from './store';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <UserProvider >
        <WebSocketProvider>
          <AppWrapper />
        </WebSocketProvider>
      </UserProvider>
    </Provider>
  </React.StrictMode>
); 