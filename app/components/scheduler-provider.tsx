'use client';
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clientScheduler } from "@/lib/services/client-scheduler";
import { useSession } from "next-auth/react";

export function SchedulerProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only initialize the scheduler if the user is authenticated
    if (status === 'authenticated' && !initialized) {
      const initializeScheduler = async () => {
        try {
          console.log('Initialisation du scheduler...');
          await clientScheduler.start();
          setInitialized(true);
        } catch (error) {
          console.error('Erreur lors de l\'initialisation du scheduler:', error);
          toast.error("Erreur lors de l'initialisation du planificateur de tâches");
        }
      };

      initializeScheduler();
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (initialized) {
        const stopScheduler = async () => {
          try {
            console.log('Arrêt du scheduler...');
            await clientScheduler.stop();
          } catch (error) {
            console.error('Erreur lors de l\'arrêt du scheduler:', error);
          }
        };
        stopScheduler();
      }
    };
  }, [status, initialized]); // Dependency on authentication status and initialization state

  return <>{children}</>;
}