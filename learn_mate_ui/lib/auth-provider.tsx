'use client';

import { useEffect } from 'react';
import { useAuthStore } from './auth-store';
import { syncService } from './sync-service';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    checkAuth();

    syncService.start();

    return () => {
      syncService.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
