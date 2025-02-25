import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
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
            <button className="h-9 w-9 rounded-md border">
              {/* Icon pour le thème */}
              <span className="sr-only">Toggle theme</span>
            </button>
            <button className="text-sm font-medium">
              Déconnexion
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  )
}