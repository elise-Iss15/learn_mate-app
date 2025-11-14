'use client';

import { useState, useEffect } from 'react';
import { offlineDownloadService, DownloadProgress } from '@/lib/offline-service';

export function useOfflineSubject(subjectId: number) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>({
    status: 'idle',
    progress: 0,
  });

  useEffect(() => {
    const checkAvailability = async () => {
      const available = await offlineDownloadService.isAvailableOffline(subjectId);
      setIsAvailable(available);
      setIsDownloading(offlineDownloadService.isDownloading(subjectId));
    };

    checkAvailability();

    const unsubscribe = offlineDownloadService.subscribe(subjectId, (prog) => {
      setProgress(prog);
      setIsDownloading(prog.status === 'downloading');
      
      if (prog.status === 'completed') {
        setIsAvailable(true);
      }
    });

    return unsubscribe;
  }, [subjectId]);

  const download = async () => {
    return await offlineDownloadService.downloadSubject(subjectId);
  };

  const remove = async () => {
    const success = await offlineDownloadService.removeOfflineSubject(subjectId);
    if (success) {
      setIsAvailable(false);
    }
    return success;
  };

  return {
    isAvailable,
    isDownloading,
    progress,
    download,
    remove,
  };
}
