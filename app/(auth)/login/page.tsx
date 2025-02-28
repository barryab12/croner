import { prisma } from "@/lib/prisma";
import LoginForm from "./login-form";
import FirstAdminForm from "./first-admin-form";

// Marquer la page comme dynamique pour éviter le rendu statique
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LoginPage() {
  // Assurez-vous que la base de données est correctement initialisée
  let usersCount = 0;
  let isFirstUser = false;
  
  try {
    // Vérifier directement les utilisateurs dans la base de données
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    });
    
    usersCount = users.length;
    isFirstUser = usersCount === 0;
    
    // Si nous avons des utilisateurs mais que isFirstUser est toujours true, forcer à false
    if (usersCount > 0) {
      isFirstUser = false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification des utilisateurs:", error);
    // En cas d'erreur, supposons qu'il s'agit du premier utilisateur
    isFirstUser = true;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">
            {isFirstUser ? "Configuration initiale" : "Connexion"}
          </h1>
          <p className="text-muted-foreground">
            {isFirstUser
              ? "Créez le compte administrateur"
              : "Connectez-vous à votre compte"}
          </p>
        </div>
        {isFirstUser ? <FirstAdminForm /> : <LoginForm />}
      </div>
    </div>
  );
}