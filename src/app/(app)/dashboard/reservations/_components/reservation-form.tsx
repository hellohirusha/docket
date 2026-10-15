"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createReservation } from "@/actions/reservation.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvailabilityViewer } from "@/components/app/availability-viewer";
import { toast } from "sonner";
import type { ResourceWithDetails } from "@/types";

const schema = z.object({
  resourceId: z.string().min(1, "Select a resource"),
  startTime: z.string().min(1, "Select a start time"),
  endTime: z.string().min(1, "Select an end time"),
  notes: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ReservationForm({
  resources,
}: {
  resources: ResourceWithDetails[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedResId, setSelectedResId] = useState("");
  const [availDate, setAvailDate] = useState(new Date());

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const { startTime, endTime } = useWatch({ control });

  const proposedStart = startTime ? new Date(startTime) : undefined;
  const proposedEnd = endTime ? new Date(endTime) : undefined;

  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    register("startTime").onChange(e);
    if (e.target.value) setAvailDate(new Date(e.target.value));
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await createReservation({
      resourceId: values.resourceId,
      startTime: new Date(values.startTime),
      endTime: new Date(values.endTime),
      notes: values.notes,
    });

    if (!res.ok) {
      setServerError(res.message);
      if (res.code === "CONFLICT")
        toast.error("Time slot unavailable — another booking overlaps.");
      return;
    }

    toast.success(
      res.data.status === "CONFIRMED"
        ? "Reservation confirmed."
        : "Reservation submitted — awaiting confirmation.",
    );
    router.push("/dashboard/reservations");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Resource */}
      <div className="space-y-1.5">
        <Label>Resource *</Label>
        <Select
          onValueChange={(v) => {
            setSelectedResId(String(v));
            setValue("resourceId", String(v));
          }}
        >
          <SelectTrigger>
            <SelectValue>
              {selectedResId
                ? resources.find((r) => r.id === selectedResId)?.name
                : "Choose a resource..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {resources.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <span className="font-medium">{r.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {r.category.name}
                  {r.capacity && ` · ${r.capacity} cap.`}
                  {r.location && ` · ${r.location}`}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.resourceId && (
          <p className="text-xs text-destructive">
            {errors.resourceId.message}
          </p>
        )}
      </div>

      {/* Availability viewer — appears once a resource is selected */}
      {selectedResId && (
        <AvailabilityViewer
          resourceId={selectedResId}
          date={availDate}
          proposedStart={proposedStart}
          proposedEnd={proposedEnd}
        />
      )}

      {/* Start time */}
      <div className="space-y-1.5">
        <Label>Start time *</Label>
        <Input
          type="datetime-local"
          min={new Date().toISOString().slice(0, 16)}
          {...register("startTime")}
          onChange={handleStartChange}
        />
        {errors.startTime && (
          <p className="text-xs text-destructive">{errors.startTime.message}</p>
        )}
      </div>

      {/* End time */}
      <div className="space-y-1.5">
        <Label>End time *</Label>
        <Input
          type="datetime-local"
          min={startTime || new Date().toISOString().slice(0, 16)}
          {...register("endTime")}
        />
        {errors.endTime && (
          <p className="text-xs text-destructive">{errors.endTime.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Purpose / Notes</Label>
        <Textarea
          placeholder="What is this resource being used for?"
          rows={3}
          {...register("notes")}
        />
      </div>

      {serverError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit reservation"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
