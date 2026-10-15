"use client";

import { useState, useEffect } from "react";
import { format, startOfDay, endOfDay, isValid } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { getResourceBookings } from "@/actions/availability.actions";
import type { ReservationStatus } from "@prisma/client";

interface Slot {
  id: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

interface Props {
  resourceId: string;
  date: Date;
  proposedStart?: Date;
  proposedEnd?: Date;
}

const HOUR_START = 0;
const HOUR_END = 24;
const TOTAL_MINS = (HOUR_END - HOUR_START) * 60;

function toPercent(date: Date): number {
  const base = new Date(date);
  base.setHours(HOUR_START, 0, 0, 0);
  const mins = (date.getTime() - base.getTime()) / 60000;
  return Math.max(0, Math.min(100, (mins / TOTAL_MINS) * 100));
}

const LABELS = [0, 4, 8, 12, 16, 20, 24];
function fmtHour(h: number) {
  if (h === 0 || h === 24) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

export function AvailabilityViewer({
  resourceId,
  date,
  proposedStart,
  proposedEnd,
}: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resourceId || !isValid(date)) return;
    let cancelled = false;
    getResourceBookings(resourceId, startOfDay(date), endOfDay(date))
      .then((data) =>
        !cancelled && setSlots(
          data.map((s) => ({
            id: s.id,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
            status: s.status,
          })),
        ),
      )
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resourceId, date]);

  const showProposed =
    proposedStart &&
    proposedEnd &&
    isValid(proposedStart) &&
    isValid(proposedEnd) &&
    proposedEnd > proposedStart;

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-3 w-64" />
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
      <p className="text-xs font-medium text-muted-foreground">
        Availability for {format(date, "EEEE, d MMM yyyy")}
      </p>

      {/* Timeline bar */}
      <div className="relative h-8 rounded-md bg-background border overflow-hidden">
        {slots.map((s) => (
          <div
            key={s.id}
            className={`absolute top-0 bottom-0 ${
              s.status === "CONFIRMED" ? "bg-red-400/50" : "bg-amber-400/40"
            }`}
            title={`${format(s.startTime, "HH:mm")}–${format(s.endTime, "HH:mm")} (${s.status.toLowerCase()})`}
            style={{
              left: `${toPercent(s.startTime)}%`,
              right: `${100 - toPercent(s.endTime)}%`,
            }}
          />
        ))}

        {showProposed && (
          <div
            className="absolute top-0 bottom-0 bg-blue-500/40 border-x-2 border-blue-500/70"
            title="Your proposed slot"
            style={{
              left: `${toPercent(proposedStart!)}%`,
              right: `${100 - toPercent(proposedEnd!)}%`,
            }}
          />
        )}

        {/* Hour markers */}
        {LABELS.map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px bg-border/60"
            style={{ left: `${(h / 24) * 100}%` }}
          />
        ))}
      </div>

      {/* Hour labels */}
      <div className="flex justify-between px-0.5">
        {LABELS.map((h) => (
          <span key={h} className="text-[10px] text-muted-foreground">
            {fmtHour(h)}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {slots.length === 0 ? (
          <p className="text-xs text-emerald-600 font-medium">
            Fully available today
          </p>
        ) : (
          <>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400/50 border border-red-400/40" />
              Confirmed
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400/40 border border-amber-400/40" />
              Pending
            </span>
          </>
        )}
        {showProposed && (
          <span className="flex items-center gap-1 text-xs text-blue-600">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500/40 border border-blue-500/70" />
            Your slot
          </span>
        )}
      </div>
    </div>
  );
}
