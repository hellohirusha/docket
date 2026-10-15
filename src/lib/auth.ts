import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]>;
};

export async function getSession(): Promise<AuthenticatedSession> {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  return session as AuthenticatedSession;
}

export async function requireAdmin(): Promise<AuthenticatedSession> {
  const session = await getSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}
