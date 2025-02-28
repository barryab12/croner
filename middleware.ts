import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { withAuth } from "next-auth/middleware";
import { NextRequestWithAuth } from "next-auth/middleware";
import { Role } from "@/types/prisma";

interface AuthToken {
  role?: Role;
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const token = (await getToken({ req })) as AuthToken;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login");

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/tasks", req.url));
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    if (req.nextUrl.pathname.startsWith("/admin") && token.role !== Role.ADMIN) {
      return NextResponse.redirect(new URL("/tasks", req.url));
    }
  },
  {
    callbacks: {
      authorized() {
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/tasks/:path*", "/history", "/settings", "/api/:path*"],
};