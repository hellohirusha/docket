# Docket — Resource Reservation Management System

A centralized reservation platform built with Next.js 15, TypeScript,
PostgreSQL, and Prisma. Handles resource booking, conflict detection,
lifecycle management, and role-based access.

## Tech Stack

| Layer      | Technology               |
| ---------- | ------------------------ |
| Framework  | Next.js 15 (App Router)  |
| Language   | TypeScript 5             |
| Database   | PostgreSQL 16            |
| ORM        | Prisma 7                 |
| Auth       | Auth.js v5               |
| Validation | Zod + React Hook Form    |
| UI         | shadcn/ui + Tailwind CSS |
| Dates      | date-fns                 |

## Prerequisites

- Node.js 20+
- Docker Desktop (for local PostgreSQL)

## Setup

```bash
# 1. Clone
git clone https://github.com/hellohirusha/docket.git
cd docket

# 2. Install dependencies
npm install

# 3. Environment variables
cp .env.example .env
# Edit .env — fill in DATABASE_URL and AUTH_SECRET

# 4. Start PostgreSQL
docker compose up -d

# 5. Run migrations
npx prisma migrate dev

# 6. Seed the database
npx prisma db seed

# 7. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default accounts

| Email            | Password  | Role   |
| ---------------- | --------- | ------ |
| admin@docket.dev | admin123  | Admin  |
| sarah@docket.dev | member123 | Member |
| james@docket.dev | member123 | Member |
| priya@docket.dev | member123 | Member |

## Key features

- **Conflict-safe booking** — reservation creation uses a Prisma transaction
  to perform the overlap check and insert atomically, making double-booking
  structurally impossible
- **State machine** — reservations follow a strict lifecycle:
  PENDING → CONFIRMED → COMPLETED, with CANCELLED reachable from either
  active state. All transitions are validated server-side
- **Append-only audit log** — every status change is recorded in
  ReservationStatusHistory with actor and timestamp
- **Role-based access** — Admin users manage resources, categories, users,
  and confirm bookings. Members create and cancel their own reservations
- **Availability visualizer** — timeline bar shows existing bookings for a
  resource on a selected day, with the proposed slot highlighted in real time
- **Server Actions** — all mutations go through Server Actions with Zod
  validation; no REST API layer needed

## Architecture decisions

- **Layered architecture**: Presentation → Application (Server Actions) →
  Domain logic → Infrastructure (repositories via Prisma)
- **JWT session carries role**: avoids a database call on every request
- **Repository pattern**: Prisma queries are encapsulated in action files,
  keeping pages and components free of data access logic
- **Discriminated union result type**: every Server Action returns
  `{ ok: true, data }` or `{ ok: false, code, message }` — no thrown
  exceptions crossing the client/server boundary
