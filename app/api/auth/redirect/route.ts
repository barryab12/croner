import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Marquer la route comme dynamique
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  // Récupérer les paramètres de la requête
  const searchParams = request.nextUrl.searchParams;
  const to = searchParams.get("to") || "login";
  const success = searchParams.get("success") || "false";
  const timestamp = searchParams.get("t") || Date.now().toString();

  // Créer l'URL de redirection
  const redirectUrl = `/${to}?success=${success}&t=${timestamp}`;
  
  // Créer la réponse avec les en-têtes appropriés pour éviter la mise en cache
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  
  // Ajouter des en-têtes pour éviter la mise en cache
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
  
  return response;
}
