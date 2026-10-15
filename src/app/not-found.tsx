import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-7xl font-bold text-muted-foreground/20 select-none">
        404
      </p>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
      <Button asChild size="sm">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}
