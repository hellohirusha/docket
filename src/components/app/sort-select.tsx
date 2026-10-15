"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SortOption {
  value: string;
  label: string;
}

export function SortSelect({
  value,
  options,
  param = "sort",
}: {
  value: string;
  options: SortOption[];
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeSort(nextValue: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue === options[0]?.value) params.delete(param);
    else params.set(param, nextValue);
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Sort by</span>
      <select
        value={value}
        onChange={(event) => changeSort(event.target.value)}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Sort list"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
