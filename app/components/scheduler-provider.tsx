'use client';
import { useEffect } from "react";
import { toast } from "sonner";
import { clientScheduler } from "@/lib/services/client-scheduler";

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeScheduler = async () => {
      try {
        console.log('Initialisation du scheduler...');
        await clientScheduler.start();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du scheduler:', error);
        toast.error("Erreur lors de l'initialisation du planificateur de tâches");
      }
    };

    initializeScheduler();

    // Nettoyage lors du démontage du composant
    return () => {
      const stopScheduler = async () => {
        try {
          console.log('Arrêt du scheduler...');
          await clientScheduler.stop();
        } catch (error) {
          console.error('Erreur lors de l\'arrêt du scheduler:', error);
        }
      };
      stopScheduler();
    };
  }, []); // Une seule fois au montage

  return <>{children}</>;
}