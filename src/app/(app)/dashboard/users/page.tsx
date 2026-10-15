import { getUsers } from "@/actions/user.actions";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/app/page-header";
import { UserTable } from "./_components/user-table";
import { CreateUserDialog } from "./_components/create-user-dialog";
import { EmptyState } from "@/components/app/empty-state";
import { Users } from "lucide-react";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await requireAdmin();
  const users = await getUsers();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description={`${users.length} user${users.length !== 1 ? "s" : ""} in the system`}
        action={<CreateUserDialog />}
      />
      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Create accounts so members can sign in and make reservations."
          action={<CreateUserDialog />}
        />
      ) : (
        <UserTable users={users} currentUserId={session.user.id} />
      )}
    </div>
  );
}
