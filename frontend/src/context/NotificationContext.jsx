import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';
import { fetchUnreadCount } from '../services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // Non-critical — silently ignore, the notifications page will still work
    }
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return undefined;

    refreshUnreadCount();
    const socket = connectSocket();

    const handleNewNotification = (notification) => {
      setUnreadCount((prev) => prev + 1);
      toast(notification.title, { icon: '🔔' });
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
      disconnectSocket();
    };
  }, [isAuthenticated, isLoading, refreshUnreadCount]);

  const value = { unreadCount, setUnreadCount, refreshUnreadCount };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
