"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getResourceBookings(
  resourceId: string,
  from: Date,
  to: Date,
) {
  await getSession();

  return prisma.reservation.findMany({
    where: {
      resourceId,
      status: { in: ["PENDING", "CONFIRMED"] },
      AND: [{ startTime: { lt: to } }, { endTime: { gt: from } }],
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
    },
    orderBy: { startTime: "asc" },
  });
}
