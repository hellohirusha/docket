import { prisma } from "@/lib/prisma";

export async function hasConflict({
  resourceId,
  startTime,
  endTime,
  excludeReservationId,
}: {
  resourceId: string;
  startTime: Date;
  endTime: Date;
  excludeReservationId?: string;
}): Promise<boolean> {
  const conflict = await prisma.reservation.findFirst({
    where: {
      resourceId,
      status: { in: ["PENDING", "CONFIRMED"] },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
    },
  });

  return !!conflict;
}
