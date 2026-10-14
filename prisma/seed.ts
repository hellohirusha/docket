import "dotenv/config";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
console.log("URL value:", JSON.stringify(process.env.DATABASE_URL));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

async function main() {
  const hash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@docket.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@docket.dev",
      passwordHash: hash,
      role: "ADMIN",
    },
  });

  await prisma.resourceCategory.createMany({
    data: [
      { name: "Meeting Rooms" },
      { name: "Equipment" },
      { name: "Vehicles" },
    ],
    skipDuplicates: true,
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
