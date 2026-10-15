"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ResourceCategory } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
});
const idsSchema = z.array(z.string().cuid()).min(1).max(100);

export async function deleteCategories(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  await requireAdmin();
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return fail("VALIDATION", "Select at least one valid category");

  const categories = await prisma.resourceCategory.findMany({
    where: { id: { in: parsed.data } },
    select: { id: true, _count: { select: { resources: true } } },
  });
  if (categories.some((category) => category._count.resources > 0)) {
    return fail("HAS_RESOURCES", "Categories with resources cannot be deleted");
  }

  const result = await prisma.resourceCategory.deleteMany({ where: { id: { in: parsed.data } } });
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/resources");
  return ok({ deleted: result.count });
}

export async function createCategory(
  raw: unknown,
): Promise<ActionResult<ResourceCategory>> {
  await requireAdmin();

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success)
    return fail("VALIDATION", parsed.error.issues[0].message);

  const existing = await prisma.resourceCategory.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) return fail("DUPLICATE", "Category name already exists");

  const category = await prisma.resourceCategory.create({
    data: parsed.data,
  });

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/resources");
  return ok(category);
}

export async function getCategories() {
  return prisma.resourceCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { resources: true } } },
  });
}
