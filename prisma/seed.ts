import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Seeding database...");

  // Skip if already seeded
  const count = await prisma.user.count();
  if (count > 0) {
    console.log("⏭️  Already seeded — skipping.");
    return;
  }

  // ── Users ────────────────────────────────────────────────────────────────
  const [adminHash, memberHash] = await Promise.all([
    bcrypt.hash("admin123", 12),
    bcrypt.hash("member123", 12),
  ]);

  const [admin, sarah, james, priya] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alex Admin",
        email: "admin@docket.dev",
        passwordHash: adminHash,
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Chen",
        email: "sarah@docket.dev",
        passwordHash: memberHash,
        role: "MEMBER",
      },
    }),
    prisma.user.create({
      data: {
        name: "James Rivera",
        email: "james@docket.dev",
        passwordHash: memberHash,
        role: "MEMBER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Priya Nair",
        email: "priya@docket.dev",
        passwordHash: memberHash,
        role: "MEMBER",
      },
    }),
  ]);

  // ── Categories ────────────────────────────────────────────────────────────
  const [meetingCat, equipCat, vehicleCat] = await Promise.all([
    prisma.resourceCategory.create({
      data: {
        name: "Meeting Rooms",
        description: "Dedicated spaces for team meetings and client calls",
      },
    }),
    prisma.resourceCategory.create({
      data: {
        name: "Equipment",
        description: "Shared devices and tools available for checkout",
      },
    }),
    prisma.resourceCategory.create({
      data: {
        name: "Vehicles",
        description: "Company vehicles for official business use",
      },
    }),
  ]);

  // ── Resources ─────────────────────────────────────────────────────────────
  const [roomA, roomB, roomC, macbook, projector] = await Promise.all([
    prisma.resource.create({
      data: {
        name: "Conference Room A",
        status: "ACTIVE",
        capacity: 12,
        location: "Floor 2 — Room 201",
        description: "Projector, whiteboard, video conferencing",
        categoryId: meetingCat.id,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Conference Room B",
        status: "ACTIVE",
        capacity: 6,
        location: "Floor 2 — Room 202",
        description: "TV display, whiteboard",
        categoryId: meetingCat.id,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Board Room",
        status: "ACTIVE",
        capacity: 20,
        location: "Floor 5 — Room 501",
        description: "Executive boardroom with panoramic view",
        categoryId: meetingCat.id,
      },
    }),
    prisma.resource.create({
      data: {
        name: 'MacBook Pro 16"',
        status: "ACTIVE",
        capacity: 1,
        location: "IT Storage — Floor 1",
        description: "M3 Max — 64GB RAM",
        categoryId: equipCat.id,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Portable Projector",
        status: "ACTIVE",
        capacity: 1,
        location: "IT Storage — Floor 1",
        description: "4K HDMI projector with carry case",
        categoryId: equipCat.id,
      },
    }),
    prisma.resource.create({
      data: {
        name: "Company Van",
        status: "ACTIVE",
        capacity: 8,
        location: "Basement Parking — Bay 3",
        description: "8-seater for team travel and equipment transport",
        categoryId: vehicleCat.id,
      },
    }),
  ]);

  // ── Reservations ──────────────────────────────────────────────────────────
  const now = new Date();
  const day = (d: number) => new Date(now.getTime() + d * 86_400_000);
  const at = (base: Date, h: number, m = 0) => {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const reservations = await Promise.all([
    // CONFIRMED — Room A today
    prisma.reservation.create({
      data: {
        userId: sarah.id,
        resourceId: roomA.id,
        startTime: at(now, 10),
        endTime: at(now, 12),
        status: "CONFIRMED",
        notes: "Q3 planning session",
      },
    }),
    // CONFIRMED — Room B today
    prisma.reservation.create({
      data: {
        userId: james.id,
        resourceId: roomB.id,
        startTime: at(now, 14),
        endTime: at(now, 15, 30),
        status: "CONFIRMED",
        notes: "Design review",
      },
    }),
    // PENDING — tomorrow
    prisma.reservation.create({
      data: {
        userId: priya.id,
        resourceId: roomA.id,
        startTime: at(day(1), 9),
        endTime: at(day(1), 10),
        status: "PENDING",
        notes: "New hire onboarding",
      },
    }),
    // PENDING — MacBook
    prisma.reservation.create({
      data: {
        userId: james.id,
        resourceId: macbook.id,
        startTime: at(day(1), 13),
        endTime: at(day(1), 17),
        status: "PENDING",
        notes: "Client demo preparation",
      },
    }),
    // CONFIRMED — Board Room next week
    prisma.reservation.create({
      data: {
        userId: sarah.id,
        resourceId: roomC.id,
        startTime: at(day(3), 10),
        endTime: at(day(3), 13),
        status: "CONFIRMED",
        notes: "All-hands meeting",
      },
    }),
    // COMPLETED — Room B yesterday
    prisma.reservation.create({
      data: {
        userId: priya.id,
        resourceId: roomB.id,
        startTime: at(day(-1), 14),
        endTime: at(day(-1), 16),
        status: "COMPLETED",
        notes: "Sprint retrospective",
      },
    }),
    // CANCELLED
    prisma.reservation.create({
      data: {
        userId: james.id,
        resourceId: projector.id,
        startTime: at(day(-2), 9),
        endTime: at(day(-2), 11),
        status: "CANCELLED",
      },
    }),
  ]);

  // ── Status History ────────────────────────────────────────────────────────
  const [r1, r2, r3, r4, r5, r6, r7] = reservations;

  await prisma.reservationStatusHistory.createMany({
    data: [
      // r1 PENDING → CONFIRMED
      {
        reservationId: r1.id,
        prevStatus: null,
        newStatus: "PENDING",
        actorId: sarah.id,
      },
      {
        reservationId: r1.id,
        prevStatus: "PENDING",
        newStatus: "CONFIRMED",
        actorId: admin.id,
      },
      // r2 PENDING → CONFIRMED
      {
        reservationId: r2.id,
        prevStatus: null,
        newStatus: "PENDING",
        actorId: james.id,
      },
      {
        reservationId: r2.id,
        prevStatus: "PENDING",
        newStatus: "CONFIRMED",
        actorId: admin.id,
      },
      // r3 PENDING
      {
        reservationId: r3.id,
        prevStatus: null,
        newStatus: "PENDING",
        actorId: priya.id,
      },
      // r4 PENDING
      {
        reservationId: r4.id,
        prevStatus: null,
        newStatus: "PENDING",
        actorId: james.id,
      },
      // r5 PENDING → CONFIRMED
      {
        reservationId: r5.id,
        prevStatus: null,
        newStatus: "PENDING",
        actorId: sarah.id,
      },
      {
        reservationId: r5.id,
        prevStatus: "PENDING",
        newStatus: "CONFIRMED",
        actorId: admin.id,
      },
      // r6 PENDING → CONFIRMED → COMPLETED
      {
        reservationId: r6.id,
        prevStatus: null,
        newStatus: "PENDING",
        actorId: priya.id,
      },
      {
        reservationId: r6.id,
        prevStatus: "PENDING",
        newStatus: "CONFIRMED",
        actorId: admin.id,
      },
      {
        reservationId: r6.id,
        prevStatus: "CONFIRMED",
        newStatus: "COMPLETED",
        actorId: admin.id,
      },
      // r7 PENDING → CANCELLED
      {
        reservationId: r7.id,
        prevStatus: null,
        newStatus: "PENDING",
        actorId: james.id,
      },
      {
        reservationId: r7.id,
        prevStatus: "PENDING",
        newStatus: "CANCELLED",
        actorId: james.id,
      },
    ],
  });

  console.log("✅  Seeding complete.");
  console.log("");
  console.log("   👤  admin@docket.dev   /  admin123  (Admin)");
  console.log("   👤  sarah@docket.dev   /  member123 (Member)");
  console.log("   👤  james@docket.dev   /  member123 (Member)");
  console.log("   👤  priya@docket.dev   /  member123 (Member)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
