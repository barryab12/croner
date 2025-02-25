export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <div className="grid gap-6">
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Configurez vos préférences de notification
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Notifications par email</label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications par email pour les échecs d'exécution
                </p>
              </div>
              <input type="checkbox" className="h-6 w-6 rounded border" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Résumé quotidien</label>
                <p className="text-sm text-muted-foreground">
                  Recevoir un résumé quotidien des exécutions
                </p>
              </div>
              <input type="checkbox" className="h-6 w-6 rounded border" />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div>
            <h2 className="text-xl font-semibold">Préférences d'affichage</h2>
            <p className="text-sm text-muted-foreground">
              Personnalisez l'interface utilisateur
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Thème</label>
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2">
                <option>Système</option>
                <option>Clair</option>
                <option>Sombre</option>
              </select>
            </div>
            <div>
              <label className="font-medium">Fuseau horaire</label>
              <select className="mt-1 w-full rounded-md border bg-background px-3 py-2">
                <option>Europe/Paris</option>
                <option>UTC</option>
                <option>America/New_York</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div>
            <h2 className="text-xl font-semibold">Paramètres du compte</h2>
            <p className="text-sm text-muted-foreground">
              Gérez votre compte et vos informations personnelles
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="font-medium">Changer le mot de passe</label>
              <input
                type="password"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                placeholder="Nouveau mot de passe"
              />
            </div>
            <button className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
              Sauvegarder les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}