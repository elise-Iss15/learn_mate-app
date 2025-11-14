'use client';

import { useEffect } from 'react';
import { useAuthStore } from './auth-store';
import { syncService } from './sync-service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    // Check authentication on mount
    checkAuth();

    // Start sync service
    syncService.start();

    return () => {
      // Stop sync service on unmount
      syncService.stop();
    };
  }, [checkAuth]);

  return <>{children}</>;
}
