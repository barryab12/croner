import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth-options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { isActive: true }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[GET_ACTIVE_TASKS_ERROR]", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des tâches actives" },
      { status: 500 }
    );
  }
}