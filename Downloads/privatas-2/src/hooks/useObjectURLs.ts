import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to manage object URLs and ensure proper cleanup
 * Tracks all created URLs and revokes them on unmount
 */
export function useObjectURLs() {
  const urlsRef = useRef<Set<string>>(new Set());

  /**
   * Create an object URL and track it for cleanup
   */
  const createObjectURL = useCallback((blob: Blob | MediaSource): string => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.add(url);
    return url;
  }, []);

  /**
   * Revoke a specific object URL and remove from tracking
   */
  const revokeObjectURL = useCallback((url: string) => {
    if (urlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }
  }, []);

  /**
   * Revoke all tracked object URLs
   */
  const revokeAll = useCallback(() => {
    urlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    urlsRef.current.clear();
  }, []);

  // Cleanup all URLs on unmount
  useEffect(() => {
    return () => {
      revokeAll();
    };
  }, [revokeAll]);

  return {
    createObjectURL,
    revokeObjectURL,
    revokeAll,
    activeURLs: urlsRef.current.size,
  };
}

/**
 * Global object URL manager for non-component usage
 */
class ObjectURLManager {
  private urls = new Set<string>();

  createObjectURL(blob: Blob | MediaSource): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revokeObjectURL(url: string) {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  revokeAll() {
    this.urls.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.urls.clear();
  }

  get activeURLs() {
    return this.urls.size;
  }
}

export const objectURLManager = new ObjectURLManager();