"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8, "Minimum 8 characters"),
  role: z.nativeEnum(Role).default("MEMBER"),
});
const idsSchema = z.array(z.string().cuid()).min(1).max(100);

export async function deleteUsers(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  const session = await requireAdmin();
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return fail("VALIDATION", "Select at least one valid user");
  if (parsed.data.includes(session.user.id)) return fail("SELF_DELETE", "You cannot delete your own account");

  const users = await prisma.user.findMany({
    where: { id: { in: parsed.data } },
    select: { id: true, _count: { select: { reservations: true, statusHistory: true } } },
  });
  if (users.some((user) => user._count.reservations > 0 || user._count.statusHistory > 0)) {
    return fail("HAS_HISTORY", "Users with reservations or audit history cannot be deleted");
  }

  const result = await prisma.user.deleteMany({ where: { id: { in: parsed.data } } });
  revalidatePath("/dashboard/users");
  return ok({ deleted: result.count });
}

export async function createUser(raw: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success)
    return fail("VALIDATION", parsed.error.issues[0].message);

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) return fail("DUPLICATE", "Email already registered");

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  revalidatePath("/dashboard/users");
  return ok(undefined);
}

export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<ActionResult> {
  const session = await requireAdmin();

  if (userId === session.user.id)
    return fail("SELF_MODIFY", "You cannot change your own role");

  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/dashboard/users");
  return ok(undefined);
}

export async function getUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { reservations: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
