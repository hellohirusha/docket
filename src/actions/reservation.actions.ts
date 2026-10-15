"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ok, fail, type ActionResult } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReservationStatus, type Reservation } from "@prisma/client";

// ── Schemas ───────────────────────────────────────────────────────────────────
const createSchema = z
  .object({
    resourceId: z.string().cuid(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    notes: z.string().max(300).optional(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine((d) => d.startTime > new Date(), {
    message: "Start time must be in the future",
    path: ["startTime"],
  });

// ── Valid state machine transitions ──────────────────────────────────────────
const TRANSITIONS: Partial<Record<ReservationStatus, ReservationStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
};

export async function getCurrentTimestamp() {
  return Date.now();
}

function canTransition(from: ReservationStatus, to: ReservationStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Actions ───────────────────────────────────────────────────────────────────
export async function createReservation(
  raw: unknown,
): Promise<ActionResult<Reservation>> {
  const session = await getSession();

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success)
    return fail("VALIDATION", parsed.error.issues[0].message);

  const { resourceId, startTime, endTime, notes } = parsed.data;
  const reservationStatus: ReservationStatus =
    session.user.role === "ADMIN" ? "CONFIRMED" : "PENDING";

  // Verify resource is active
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
  });
  if (!resource) return fail("NOT_FOUND", "Resource not found");
  if (resource.status !== "ACTIVE")
    return fail("UNAVAILABLE", "Resource is not available for booking");

  // Run conflict check + insert atomically
  const result = await prisma.$transaction(async (tx) => {
    const conflict = await tx.reservation.findFirst({
      where: {
        resourceId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });
    if (conflict) return null;

    const reservation = await tx.reservation.create({
      data: {
        userId: session.user.id,
        resourceId,
        startTime,
        endTime,
        notes,
        status: reservationStatus,
      },
    });

    // Write first status history entry
    await tx.reservationStatusHistory.create({
      data: {
        reservationId: reservation.id,
        prevStatus: null,
        newStatus: reservationStatus,
        actorId: session.user.id,
      },
    });

    return reservation;
  });

  if (!result)
    return fail(
      "CONFLICT",
      "This resource is already booked for the selected time slot",
    );

  revalidatePath("/dashboard/reservations");
  revalidatePath("/dashboard");
  return ok(result);
}

export async function updateReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
): Promise<ActionResult> {
  const session = await getSession();
  const isAdmin = session.user.role === "ADMIN";

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) return fail("NOT_FOUND", "Reservation not found");

  // Members can only cancel their own
  if (!isAdmin) {
    if (reservation.userId !== session.user.id)
      return fail("FORBIDDEN", "You cannot modify this reservation");
    if (newStatus !== "CANCELLED")
      return fail("FORBIDDEN", "Members can only cancel reservations");
  }

  // Validate state machine
  if (!canTransition(reservation.status, newStatus))
    return fail(
      "INVALID_TRANSITION",
      `Cannot move from ${reservation.status} to ${newStatus}`,
    );

  await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: { status: newStatus },
    }),
    prisma.reservationStatusHistory.create({
      data: {
        reservationId,
        prevStatus: reservation.status,
        newStatus,
        actorId: session.user.id,
      },
    }),
  ]);

  revalidatePath("/dashboard/reservations");
  revalidatePath("/dashboard");
  return ok(undefined);
}

export async function getReservations(filter?: {
  status?: ReservationStatus;
  resourceId?: string;
  userId?: string;
}) {
  const session = await getSession();
  const isAdmin = session.user.role === "ADMIN";

  return prisma.reservation.findMany({
    where: {
      // Members only see their own
      userId: isAdmin ? filter?.userId : session.user.id,
      status: filter?.status,
      resourceId: filter?.resourceId,
    },
    include: {
      resource: { include: { category: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
  });
}

export async function getReservationById(id: string) {
  const session = await getSession();
  const isAdmin = session.user.role === "ADMIN";

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      resource: { include: { category: true } },
      user: { select: { id: true, name: true, email: true } },
      history: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!reservation) return null;
  if (!isAdmin && reservation.userId !== session.user.id) return null;

  return reservation;
}
