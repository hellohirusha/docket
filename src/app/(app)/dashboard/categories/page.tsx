import { getCategories } from "@/actions/category.actions";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { CreateCategoryDialog } from "./_components/create-category-dialog";
import { CategoryList } from "./_components/category-list";
import { EmptyState } from "@/components/app/empty-state";
import { Tag } from "lucide-react";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Resource Categories"
        description={`${categories.length} categor${categories.length !== 1 ? "ies" : "y"}`}
        action={<CreateCategoryDialog />}
      />
      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Categories group your resources by type — e.g. Meeting Rooms, Equipment, Vehicles."
          action={<CreateCategoryDialog />}
        />
      ) : (
        <CategoryList categories={categories} />
      )}
    </div>
  );
}
