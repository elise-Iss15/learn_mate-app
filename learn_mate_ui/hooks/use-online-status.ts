'use client';

import { useState, useEffect } from 'react';
import { networkStatus } from '@/lib/api';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(networkStatus.isOnline());

    const unsubscribe = networkStatus.onStatusChange(setIsOnline);
    return unsubscribe;
  }, []);

  return isOnline;
}
