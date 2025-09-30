import { useCallback, useEffect, useState } from 'react';
import { SecureStorage, derivePasswordFromSession } from '../lib/encryption';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for secure localStorage with encryption
 * Falls back to plain localStorage if encryption is disabled or fails
 */
export function useSecureStorage() {
  const { user } = useAuth();
  const [storage, setStorage] = useState<SecureStorage | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const secureStorage = new SecureStorage();

        // Enable encryption only if user is authenticated
        if (user?.uid) {
          const password = derivePasswordFromSession(user.uid);
          secureStorage.setPassword(password);
          secureStorage.setEnabled(true);
        } else {
          // Disable encryption for unauthenticated sessions
          secureStorage.setEnabled(false);
        }

        setStorage(secureStorage);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize secure storage:', error);
        // Fall back to basic SecureStorage without encryption
        const fallbackStorage = new SecureStorage();
        fallbackStorage.setEnabled(false);
        setStorage(fallbackStorage);
        setIsReady(true);
      }
    };

    initStorage();
  }, [user?.uid]);

  const getItem = useCallback(async (key: string): Promise<string | null> => {
    if (!storage) return localStorage.getItem(key);

    try {
      return await storage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      // Fall back to plain localStorage
      return localStorage.getItem(key);
    }
  }, [storage]);

  const setItem = useCallback(async (key: string, value: string): Promise<void> => {
    if (!storage) {
      localStorage.setItem(key, value);
      return;
    }

    try {
      await storage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      // Fall back to plain localStorage
      localStorage.setItem(key, value);
    }
  }, [storage]);

  const removeItem = useCallback(async (key: string): Promise<void> => {
    if (!storage) {
      localStorage.removeItem(key);
      return;
    }

    try {
      await storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      // Fall back to plain localStorage
      localStorage.removeItem(key);
    }
  }, [storage]);

  const clear = useCallback(async (): Promise<void> => {
    if (!storage) {
      localStorage.clear();
      return;
    }

    try {
      await storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      // Fall back to plain localStorage
      localStorage.clear();
    }
  }, [storage]);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    isReady,
    isEncrypted: storage?.isEnabled() || false,
  };
}

/**
 * Sync version for compatibility with existing code
 * Note: This doesn't use encryption, only async version does
 */
export function useSyncStorage() {
  return {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
    removeItem: (key: string) => localStorage.removeItem(key),
    clear: () => localStorage.clear(),
  };
}