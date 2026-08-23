"use client";

import {
  FileTextIcon,
  SearchIcon,
  TrendingUpIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { UserAvatar } from "~/components/user-avatar";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

type Item =
  | { kind: "community"; href: string; title: string; subtitle: string }
  | { kind: "post"; href: string; title: string; subtitle: string }
  | {
      kind: "user";
      href: string;
      title: string;
      subtitle: string;
      avatarSrc?: string | null;
    };

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const enabled = debounced.length >= MIN_QUERY_LENGTH;

  const communities = api.search.communities.useQuery(
    { q: debounced, limit: 5 },
    { enabled, placeholderData: (prev) => prev },
  );
  const posts = api.search.posts.useQuery(
    { q: debounced, limit: 5 },
    { enabled, placeholderData: (prev) => prev },
  );
  const users = api.search.users.useQuery(
    { q: debounced, limit: 3 },
    { enabled, placeholderData: (prev) => prev },
  );

  const items: Item[] = [
    ...(communities.data ?? []).map((c) => ({
      kind: "community" as const,
      href: `/community/${c.slug}`,
      title: `d/${c.slug}`,
      subtitle: c.name,
    })),
    ...(posts.data?.items ?? []).map((p) => ({
      kind: "post" as const,
      href: `/post/${p.slug}`,
      title: p.title,
      subtitle: `d/${p.community.slug} · ${p.author.username ?? p.author.name}`,
    })),
    ...(users.data ?? []).map((u) => ({
      kind: "user" as const,
      href: `/user/${u.username ?? ""}`,
      title: u.username ? `@${u.username}` : (u.name ?? ""),
      subtitle: u.name ?? "",
      avatarSrc: u.avatarSrc,
    })),
  ];

  const loading =
    enabled && (communities.isLoading || posts.isLoading || users.isLoading);
  const hasResults = items.length > 0;

  const navigateTo = (href: string) => {
    setOpen(false);
    setQuery("");
    setDebounced("");
    router.push(href);
  };

  const submitSearch = () => {
    if (query.trim()) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) {
      if (event.key === "Enter") {
        submitSearch();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
        break;
      case "Enter": {
        event.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) {
          navigateTo(items[activeIndex]!.href);
        } else {
          submitSearch();
        }
        break;
      }
      case "Escape":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="group/search focus-within:ring-ring/50 relative rounded-lg transition-[box-shadow] duration-200 focus-within:ring-3">
        <SearchIcon
          className="text-muted-foreground group-focus-within/search:text-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 transition-colors duration-200"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (debounced.length >= MIN_QUERY_LENGTH) {
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search DevsHub…"
          aria-label="Search"
          aria-expanded={open}
          className="pl-8"
        />
      </div>

      {open && enabled && (
        <div className="bg-popover text-popover-foreground ring-foreground/10 absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-lg shadow-md ring-1">
          {loading ? (
            <div className="flex flex-col gap-2 p-2" aria-hidden="true">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-center gap-2 px-1">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-4 flex-1 rounded" />
                </div>
              ))}
            </div>
          ) : hasResults ? (
            <>
              <div className="max-h-80 overflow-y-auto p-1">
                {communities.data && communities.data.length > 0 && (
                  <SearchGroup label="Communities">
                    {communities.data.map((c, i) => (
                      <SearchRow
                        key={c.id}
                        index={i}
                        activeIndex={activeIndex}
                        onHover={setActiveIndex}
                        onSelect={() => navigateTo(`/community/${c.slug}`)}
                        icon={
                          <TrendingUpIcon
                            className="size-4"
                            aria-hidden="true"
                          />
                        }
                        title={`d/${c.slug}`}
                        subtitle={c.name}
                      />
                    ))}
                  </SearchGroup>
                )}
                {posts.data && posts.data.items.length > 0 && (
                  <SearchGroup label="Posts">
                    {posts.data.items.map((p, i) => (
                      <SearchRow
                        key={p.id}
                        index={(communities.data?.length ?? 0) + i}
                        activeIndex={activeIndex}
                        onHover={setActiveIndex}
                        onSelect={() => navigateTo(`/post/${p.slug}`)}
                        icon={
                          <FileTextIcon className="size-4" aria-hidden="true" />
                        }
                        title={p.title}
                        subtitle={`d/${p.community.slug} · ${p.author.username ?? p.author.name}`}
                      />
                    ))}
                  </SearchGroup>
                )}
                {users.data && users.data.length > 0 && (
                  <SearchGroup label="Users">
                    {users.data.map((u, i) => (
                      <SearchRow
                        key={u.id}
                        index={
                          (communities.data?.length ?? 0) +
                          (posts.data?.items.length ?? 0) +
                          i
                        }
                        activeIndex={activeIndex}
                        onHover={setActiveIndex}
                        onSelect={() => navigateTo(`/user/${u.username ?? ""}`)}
                        icon={
                          u.avatarSrc ? (
                            <UserAvatar
                              name={u.name}
                              username={u.username}
                              src={u.avatarSrc}
                              size="sm"
                            />
                          ) : (
                            <UserIcon className="size-4" aria-hidden="true" />
                          )
                        }
                        title={u.username ? `@${u.username}` : (u.name ?? "")}
                        subtitle={u.name ?? ""}
                      />
                    ))}
                  </SearchGroup>
                )}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(debounced)}`}
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-b-lg border-t px-3 py-2 text-sm transition-colors duration-150"
              >
                <SearchIcon className="size-3.5" aria-hidden="true" />
                Search for &ldquo;{debounced}&rdquo;
              </Link>
            </>
          ) : (
            <div className="p-3">
              <p className="text-muted-foreground text-sm">
                No results for &ldquo;{debounced}&rdquo;
              </p>
              <Link
                href={`/search?q=${encodeURIComponent(debounced)}`}
                onClick={() => setOpen(false)}
                className="text-primary mt-1 inline-block text-sm hover:underline"
              >
                Search for &ldquo;{debounced}&rdquo;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <p className="text-muted-foreground px-2 pt-1.5 pb-0.5 text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function SearchRow({
  index,
  activeIndex,
  onHover,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  index: number;
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onHover(index)}
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-100",
        activeIndex === index
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground line-clamp-1 font-medium">
          {title}
        </span>
        {subtitle && (
          <span className="text-muted-foreground line-clamp-1 block text-xs">
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}
