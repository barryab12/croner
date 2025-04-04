import NextAuth from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: Role;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    id?: string;
  }
}