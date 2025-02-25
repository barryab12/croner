import { prisma } from "@/lib/prisma";
import LoginForm from "./login-form";
import FirstAdminForm from "./first-admin-form";

export default async function LoginPage() {
  const usersCount = await prisma.user.count();
  const isFirstUser = usersCount === 0;

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