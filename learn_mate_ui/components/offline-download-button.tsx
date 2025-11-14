'use client';

import { useOfflineSubject } from '@/hooks/use-offline-subject';
import { Button } from '@/components/ui/button';
import { Download, Check, Loader2, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface OfflineButtonProps {
  subjectId: number;
  subjectName: string;
}

export function OfflineDownloadButton({ subjectId, subjectName }: OfflineButtonProps) {
  const { isAvailable, isDownloading, progress, download, remove } = useOfflineSubject(subjectId);
  const isOnline = useOnlineStatus();

  if (isDownloading) {
    return (
      <div className="space-y-2 min-w-[200px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{progress.currentStep}</span>
        </div>
        <Progress value={progress.progress} />
      </div>
    );
  }

  if (isAvailable) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled
        >
          <Check className="h-4 w-4 text-green-600" />
          Available Offline
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={remove}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Remove
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={download}
      disabled={!isOnline}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Download for Offline
    </Button>
  );
}
