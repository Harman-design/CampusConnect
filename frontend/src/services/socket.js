import { io } from 'socket.io-client';
import { getAccessToken } from './api';

const getFallbackSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://campusconnect-864s.onrender.com';
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || getFallbackSocketUrl();

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token: getAccessToken() },
    withCredentials: true,
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
