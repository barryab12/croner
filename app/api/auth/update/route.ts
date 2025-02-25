import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Non authentifié" },
        { status: 401 }
      );
    }

    const { name, currentPassword, newPassword } = await req.json();

    // Si un nouveau mot de passe est fourni, vérifier l'ancien
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Mot de passe actuel requis" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      const isValid = await compare(currentPassword, user?.password || '');

      if (!isValid) {
        return NextResponse.json(
          { message: "Mot de passe actuel incorrect" },
          { status: 400 }
        );
      }
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      name,
    };

    if (newPassword) {
      updateData.password = await hash(newPassword, 12);
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json({
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    console.error("[UPDATE_USER_ERROR]", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la mise à jour" },
      { status: 500 }
    );
  }
}