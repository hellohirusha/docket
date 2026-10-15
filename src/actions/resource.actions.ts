"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, getSession } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ResourceStatus, type Resource } from "@prisma/client";
import type { ResourceWithDetails } from "@/types";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  categoryId: z.string().cuid(),
  capacity: z.coerce.number().int().positive().optional(),
  location: z.string().max(100).optional(),
  status: z.nativeEnum(ResourceStatus).default("ACTIVE"),
});

const updateSchema = createSchema.partial().extend({
  id: z.string().cuid(),
});
const idsSchema = z.array(z.string().cuid()).min(1).max(100);

export async function deleteResources(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  await requireAdmin();
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return fail("VALIDATION", "Select at least one valid resource");

  const resources = await prisma.resource.findMany({
    where: { id: { in: parsed.data } },
    select: { id: true, _count: { select: { reservations: true } } },
  });
  if (resources.some((resource) => resource._count.reservations > 0)) {
    return fail("HAS_RESERVATIONS", "Resources with reservations cannot be deleted");
  }

  const result = await prisma.resource.deleteMany({ where: { id: { in: parsed.data } } });
  revalidatePath("/dashboard/resources");
  revalidatePath("/dashboard");
  return ok({ deleted: result.count });
}

export async function createResource(
  raw: unknown,
): Promise<ActionResult<Resource>> {
  await requireAdmin();

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success)
    return fail("VALIDATION", parsed.error.issues[0].message);

  const resource = await prisma.resource.create({ data: parsed.data });
  revalidatePath("/dashboard/resources");
  return ok(resource);
}

export async function updateResource(
  raw: unknown,
): Promise<ActionResult<Resource>> {
  await requireAdmin();

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success)
    return fail("VALIDATION", parsed.error.issues[0].message);

  const { id, ...data } = parsed.data;
  const resource = await prisma.resource.update({ where: { id }, data });
  revalidatePath("/dashboard/resources");
  return ok(resource);
}

export async function updateResourceStatus(
  id: string,
  status: ResourceStatus,
): Promise<ActionResult<Resource>> {
  await requireAdmin();

  if (status !== "ACTIVE") {
    const active = await prisma.reservation.count({
      where: { resourceId: id, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    if (active > 0)
      return fail(
        "HAS_ACTIVE_RESERVATIONS",
        "Cannot deactivate a resource with active reservations",
      );
  }

  const resource = await prisma.resource.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/dashboard/resources");
  return ok(resource);
}

export async function getResources(
  categoryId?: string,
): Promise<ResourceWithDetails[]> {
  await getSession();

  return prisma.resource.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: {
      category: true,
      _count: {
        select: {
          reservations: {
            where: { status: { in: ["PENDING", "CONFIRMED"] } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
