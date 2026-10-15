import { getResources } from "@/actions/resource.actions";
import { getCategories } from "@/actions/category.actions";
import { getSession } from "@/lib/auth";
import { ResourceTable } from "./_components/resource-table";
import { CreateResourceDialog } from "./_components/create-resource-dialog";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Boxes } from "lucide-react";
import { SortSelect } from "@/components/app/sort-select";

export const metadata = { title: "Resources" };

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "capacity", label: "Capacity" },
  { value: "bookings", label: "Active bookings" },
];

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const sort = params.sort ?? "name";
  const session = await getSession();
  const [resources, categories] = await Promise.all([
    getResources(),
    getCategories(),
  ]);
  const isAdmin = session.user.role === "ADMIN";
  resources.sort((a, b) => {
    if (sort === "status") return a.status.localeCompare(b.status) || a.name.localeCompare(b.name);
    if (sort === "capacity") return (b.capacity ?? -1) - (a.capacity ?? -1) || a.name.localeCompare(b.name);
    if (sort === "bookings") return b._count.reservations - a._count.reservations || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resources"
        description={`${resources.length} resource${resources.length !== 1 ? "s" : ""} across ${categories.length} categor${categories.length !== 1 ? "ies" : "y"}`}
        action={
          <div className="flex items-center gap-3">
            <SortSelect value={sort} options={SORT_OPTIONS} />
            {isAdmin ? <CreateResourceDialog categories={categories} /> : null}
          </div>
        }
      />
      {resources.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No resources yet"
          description="Create a category first, then add resources to it."
          action={
            isAdmin ? (
              <CreateResourceDialog categories={categories} />
            ) : undefined
          }
        />
      ) : (
        <ResourceTable
          resources={resources}
          categories={categories}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
