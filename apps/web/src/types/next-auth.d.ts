import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "CADET_HELPER" | "TECHNICIAN" | "ADMIN";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "CADET_HELPER" | "TECHNICIAN" | "ADMIN";
  }
}
