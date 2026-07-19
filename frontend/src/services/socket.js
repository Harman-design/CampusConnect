import { io } from 'socket.io-client';
import { getAccessToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

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
