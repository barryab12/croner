'use client';

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get("name") as string,
      currentPassword: formData.get("currentPassword") as string,
      newPassword: formData.get("newPassword") as string,
    };

    try {
      const response = await fetch("/api/auth/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Une erreur est survenue");
      }

      const updatedUser = await response.json();
      await update({
        ...session,
        user: {
          ...session?.user,
          ...updatedUser,
        },
      });

      setSuccess("Vos informations ont été mises à jour avec succès");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Paramètres</h1>

      <form onSubmit={onSubmit} className="grid gap-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-500">
            {success}
          </div>
        )}

        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div>
            <h2 className="text-xl font-semibold">Paramètres du compte</h2>
            <p className="text-sm text-muted-foreground">
              Gérez votre compte et vos informations personnelles
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="font-medium">
                Nom
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={session?.user?.name || ""}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="email" className="font-medium">
                Email
              </label>
              <div className="mt-1 w-full rounded-md border bg-muted/50 px-3 py-2">
                {session?.user?.email}
              </div>
            </div>

            <div>
              <label htmlFor="currentPassword" className="font-medium">
                Mot de passe actuel
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                placeholder="Requis pour changer le mot de passe"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="font-medium">
                Nouveau mot de passe
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                placeholder="Laisser vide pour ne pas changer"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Mise à jour..." : "Sauvegarder les modifications"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}