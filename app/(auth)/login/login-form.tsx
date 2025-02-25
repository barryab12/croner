'use client';

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { LockClosedIcon } from "@radix-ui/react-icons";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      router.refresh();
      router.push("/tasks");
    } catch (error) {
      setError("Une erreur est survenue");
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
          />
          <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-primary px-8 py-2.5 text-white hover:bg-primary/90 disabled:opacity-50 font-medium"
      >
        {isLoading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}