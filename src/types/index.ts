import type {
  User,
  Resource,
  ResourceCategory,
  Reservation,
  ReservationStatusHistory,
  ResourceStatus,
  ReservationStatus,
  Role,
} from "@prisma/client";

export type ResourceWithDetails = Resource & {
  category: ResourceCategory;
  _count: { reservations: number };
};

export type CategoryWithCount = ResourceCategory & {
  _count: { resources: number };
};

export type ReservationWithDetails = Reservation & {
  resource: Resource & { category: ResourceCategory };
  user: Pick<User, "id" | "name" | "email">;
};

export type ReservationWithHistory = ReservationWithDetails & {
  history: (ReservationStatusHistory & {
    actor: Pick<User, "name">;
  })[];
};

export type UserWithStats = Pick<
  User,
  "id" | "name" | "email" | "role" | "createdAt"
> & {
  _count: { reservations: number };
};

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
}

export type { ResourceStatus, ReservationStatus, Role };
