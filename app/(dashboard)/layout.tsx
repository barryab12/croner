'use client';

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { ExitIcon } from "@radix-ui/react-icons"
import { ThemeToggle } from "@/app/components/theme-toggle"
import { SchedulerProvider } from '@/app/components/scheduler-provider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SchedulerProvider>
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 border-b z-[60] bg-background shadow-sm">
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-4">
              <Link href="/tasks" className="text-xl font-bold">
                Croner
              </Link>
              <div className="flex space-x-4">
                <Link href="/tasks" className="text-sm font-medium transition-colors hover:text-primary">
                  Tâches
                </Link>
                <Link href="/history" className="text-sm font-medium transition-colors hover:text-primary">
                  Historique
                </Link>
                <Link href="/settings" className="text-sm font-medium transition-colors hover:text-primary">
                  Paramètres
                </Link>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-4">
              <ThemeToggle />
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="h-9 w-9 rounded-md border inline-flex items-center justify-center hover:bg-muted transition-colors"
                title="Déconnexion"
              >
                <ExitIcon className="h-4 w-4" />
                <span className="sr-only">Déconnexion</span>
              </button>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </div>
    </SchedulerProvider>
  );
}