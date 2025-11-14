'use client';

import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from '@/lib/sync-service';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    status: 'idle',
    progress: 0,
  });

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
}

export function useQueueStatus() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await syncService.getStatus();
      setPending(status.pending);
    };

    checkStatus();

    // Update every 5 seconds
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return pending;
}
