'use client';

import { taskScheduler } from "@/lib/services/scheduler";
import { useEffect } from "react";

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeScheduler = async () => {
      console.log('Initialisation du scheduler...');
      await taskScheduler.start();
    };

    initializeScheduler();

    // Nettoyage lors du démontage du composant
    return () => {
      console.log('Nettoyage du scheduler...');
      taskScheduler.stop();
    };
  }, []); // Une seule fois au montage

  return <>{children}</>;
}