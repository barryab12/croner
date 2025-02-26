'use client';

import { useEffect, useState } from 'react';
import { taskScheduler } from '@/lib/services/scheduler';

export default function SchedulerProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeScheduler = async () => {
      if (!isInitialized) {
        await taskScheduler.start();
        setIsInitialized(true);
      }
    };

    initializeScheduler();

    return () => {
      taskScheduler.stop();
    };
  }, [isInitialized]);

  return <>{children}</>;
}