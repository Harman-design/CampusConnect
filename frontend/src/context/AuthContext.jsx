import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  fetchCurrentUser,
  refreshSession,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while bootstrapping session
  const [error, setError] = useState(null);

  // On first load, try to silently restore the session from the refresh cookie.
  useEffect(() => {
    let isMounted = true;
    const hasSession = document.cookie.split(';').some((item) => item.trim().startsWith('ccLoggedIn='));

    if (!hasSession) {
      if (isMounted) {
        setUser(null);
        setIsLoading(false);
      }
      return;
    }

    (async () => {
      try {
        await refreshSession();
        const currentUser = await fetchCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch (err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const loggedInUser = await loginUser(credentials);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    try {
      const newUser = await registerUser(payload);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty',
    isStudent: user?.role === 'student',
    isLoading,
    error,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
