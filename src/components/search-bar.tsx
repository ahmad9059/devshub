"use client";

import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Input } from "~/components/ui/input";

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className="group/search focus-within:ring-ring/50 relative rounded-lg transition-[box-shadow] duration-200 focus-within:ring-3">
        <SearchIcon
          className="text-muted-foreground group-focus-within/search:text-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 transition-colors duration-200"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search DevsHub…"
          aria-label="Search"
          className="pl-8"
        />
      </div>
    </form>
  );
}
