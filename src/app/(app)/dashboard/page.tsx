import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Boxes, CalendarCheck, Clock, Plus, ArrowRight } from "lucide-react";
import { format, startOfDay, endOfDay, isToday } from "date-fns";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await getSession();
  const isAdmin = session.user.role === "ADMIN";
  const today = new Date();

  const [totalActive, pendingCount, todayConfirmed, myUpcoming] =
    await Promise.all([
      prisma.resource.count({ where: { status: "ACTIVE" } }),

      prisma.reservation.count({
        where: {
          status: "PENDING",
          ...(!isAdmin && { userId: session.user.id }),
        },
      }),

      prisma.reservation.findMany({
        where: {
          status: "CONFIRMED",
          startTime: { gte: startOfDay(today) },
          endTime: { lte: endOfDay(today) },
          ...(!isAdmin && { userId: session.user.id }),
        },
        include: {
          resource: { include: { category: true } },
          user: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      prisma.reservation.findMany({
        where: {
          userId: session.user.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { gt: today },
        },
        include: { resource: { include: { category: true } } },
        orderBy: { startTime: "asc" },
        take: 5,
      }),
    ]);

  const stats = [
    {
      title: "Active Resources",
      value: totalActive,
      icon: Boxes,
      description: "Available for booking",
      href: "/dashboard/resources",
    },
    {
      title: "Awaiting Confirmation",
      value: pendingCount,
      icon: Clock,
      description: isAdmin ? "Pending your review" : "Pending admin approval",
      href: "/dashboard/reservations?status=PENDING",
    },
    {
      title: "Confirmed Today",
      value: todayConfirmed.length,
      icon: CalendarCheck,
      description: format(today, "EEEE, d MMMM"),
      href: "/dashboard/reservations?status=CONFIRMED",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {greeting()}, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(today, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/reservations/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New reservation
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.title} href={s.href} className="group">
            <Card className="transition-shadow group-hover:shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.title}
                </CardTitle>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's schedule */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Today&apos;s confirmed bookings
              </CardTitle>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
              >
                <Link href="/dashboard/reservations?status=CONFIRMED">
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayConfirmed.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No confirmed bookings for today.
              </p>
            ) : (
              <div className="divide-y">
                {todayConfirmed.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/reservations/${r.id}`}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:underline underline-offset-2 truncate">
                        {r.resource.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {r.resource.category.name}
                        </p>
                        {isAdmin && (
                          <p className="text-xs text-muted-foreground">
                            · {r.user.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums shrink-0 ml-3">
                      {format(new Date(r.startTime), "HH:mm")}–
                      {format(new Date(r.endTime), "HH:mm")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My upcoming */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Your upcoming reservations
              </CardTitle>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
              >
                <Link href="/dashboard/reservations">
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {myUpcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <p className="text-sm text-muted-foreground">
                  No upcoming reservations.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/reservations/new">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Book something
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {myUpcoming.map((r) => (
                  <Link
                    key={r.id}
                    href={`/dashboard/reservations/${r.id}`}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium group-hover:underline underline-offset-2 truncate">
                        {r.resource.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isToday(new Date(r.startTime))
                          ? `Today · ${format(new Date(r.startTime), "HH:mm")}`
                          : format(new Date(r.startTime), "EEE d MMM · HH:mm")}
                      </p>
                    </div>
                    <StatusBadge status={r.status} className="shrink-0 ml-3" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin — pending approvals banner */}
      {isAdmin && pendingCount > 0 && (
        <Card className="border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100/80 dark:bg-amber-900/30 p-2">
                <Clock className="w-4 h-4 text-amber-600/90 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {pendingCount} reservation{pendingCount !== 1 ? "s" : ""}{" "}
                  awaiting confirmation
                </p>
                <p className="text-xs text-muted-foreground">
                  Review and confirm or decline pending bookings
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/reservations?status=PENDING">
                Review now
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
