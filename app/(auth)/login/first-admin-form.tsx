'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hash } from "bcryptjs";
import { 
  EnvelopeClosedIcon, 
  LockClosedIcon,
  PersonIcon 
} from "@radix-ui/react-icons";

export default function FirstAdminForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    try {
      const hashedPassword = await hash(password, 12);
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password: hashedPassword,
          isFirstUser: true,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue");
      }

      try {
        // 1. Définir un cookie pour indiquer que l'admin a été créé
        document.cookie = "adminCreated=true; path=/";
        
        // 2. Utiliser location.replace avec un timestamp pour éviter la mise en cache
        const timestamp = Date.now();
        
        // 3. Rediriger vers une page intermédiaire qui va ensuite rediriger vers login
        const redirectUrl = `/api/auth/redirect?to=login&success=true&t=${timestamp}`;
        window.location.replace(redirectUrl);
      } catch (error) {
        console.error("Erreur lors de la redirection:", error);
        // Dernier recours
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erreur lors de la création du compte:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 w-full max-w-sm">
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
      <div className="space-y-2">
        <div className="relative">
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border bg-background pl-10 pr-3 py-2"
            placeholder="Nom complet"
            aria-label="Nom complet"
            suppressHydrationWarning={true}
          />
          <PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border bg-background pl-10 pr-3 py-2"
            placeholder="Adresse email"
            aria-label="Adresse email"
            suppressHydrationWarning={true}
          />
          <EnvelopeClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border bg-background pl-10 pr-3 py-2"
            placeholder="Mot de passe"
            aria-label="Mot de passe"
            suppressHydrationWarning={true}
          />
          <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="w-full rounded-md border bg-background pl-10 pr-3 py-2"
            placeholder="Confirmer le mot de passe"
            aria-label="Confirmer le mot de passe"
            suppressHydrationWarning={true}
          />
          <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary px-8 py-2.5 text-white hover:bg-primary/90 disabled:opacity-50 font-medium"
      >
        {isLoading ? "Création..." : "Créer le compte administrateur"}
      </button>
    </form>
  );
}