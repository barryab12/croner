import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Marquer la route comme dynamique
export const dynamic = 'force-dynamic';

export async function POST(req: globalThis.Request) {
  try {
    const body = await req.json();
    const { email, password, name, isFirstUser } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier s'il s'agit du premier utilisateur
    const usersCount = await prisma.user.count();

    // Si ce n'est pas le premier utilisateur et que isFirstUser est true, c'est une erreur
    if (usersCount > 0 && isFirstUser) {
      return NextResponse.json(
        { message: "Un administrateur existe déjà" },
        { status: 400 }
      );
    }

    // Si c'est le premier utilisateur, lui donner le rôle d'administrateur
    const role = usersCount === 0 ? "ADMIN" : "USER";

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
      },
    });

    return NextResponse.json(
      { message: "Utilisateur créé avec succès", user: { id: user.id, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de l'enregistrement" },
      { status: 500 }
    );
  }
}