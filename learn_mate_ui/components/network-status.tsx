'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useQueueStatus } from '@/hooks/use-sync-status';
import { Wifi, WifiOff, Cloud, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function NetworkStatus() {
  const isOnline = useOnlineStatus();
  const pendingSync = useQueueStatus();

  if (isOnline && pendingSync === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You are offline. Some features may be limited.
          </AlertDescription>
        </Alert>
      )}
      
      {pendingSync > 0 && (
        <Alert className="border-blue-500 bg-blue-50">
          <Cloud className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pendingSync} action(s) pending sync</span>
            <Badge variant="secondary">{pendingSync}</Badge>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function NetworkIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600">Offline</span>
        </>
      )}
    </div>
  );
}
