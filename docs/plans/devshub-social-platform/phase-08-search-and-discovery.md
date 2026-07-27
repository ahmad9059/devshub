# Phase 8 — Search & Discovery

Covers: Full-text search posts/communities/users, trending, explore page
Issue register rows owned: 13

---

## 1. Goal

Enable users to search for posts, communities, and users by keyword. Add an explore page showing trending communities and popular posts. Search is available to everyone (no login required).

## 2. Scope

### In Scope
1. Search bar in the layout header (or left sidebar)
2. Search results page (`/search?q=...`) with tabs: Posts, Communities, Users
3. Full-text search using PostgreSQL `ILIKE` or `to_tsvector` (GIN index)
4. Trending communities widget (right sidebar)
5. Explore page (`/explore`) — trending posts and communities
6. tRPC router for search queries
7. Search result cards (reuse PostCard, community list, user list)

### Out Of Scope
- Elasticsearch / Meilisearch integration (PostgreSQL FTS is sufficient for launch)
- Search autocomplete / typeahead (deferred)
- Search filters (date range, community, author) — deferred
- Saved searches — deferred

## 3. Detailed Tasks

### 3.1 Full-Text Search Indexes
- Add GIN indexes on `devshub_posts.title` and `devshub_posts.body` using `to_tsvector('english', ...)`
- Add GIN index on `devshub_communities.name` and `devshub_communities.description`
- Add GIN index on `devshub_users.username`
- Migration: `pnpm db:generate` + `pnpm db:push`
- Use Drizzle `index().on()` with `sql` raw expression for GIN

### 3.2 Search tRPC Router
- File: `src/server/api/routers/search.ts` (new)
- `posts` (publicProcedure): input `{ q: string, limit?, cursor? }`, full-text search on posts title + body, return paginated results
- `communities` (publicProcedure): input `{ q: string, limit? }`, ILIKE search on name + slug + description
- `users` (publicProcedure): input `{ q: string, limit? }`, ILIKE search on username
- `trending` (publicProcedure): return top communities by member count growth (or just member count for launch) + top posts by score in last 24h
- Register in `src/server/api/root.ts`

### 3.3 Search Bar Component
- File: `src/components/search-bar.tsx` (new, client component)
- shadcn `Input` with search icon (lucide `SearchIcon`)
- On submit: navigate to `/search?q=...`
- Place in layout header or left sidebar

### 3.4 Search Results Page
- File: `src/app/search/page.tsx` (new)
- Read `q` from URL search params
- Tabs (shadcn `Tabs`): Posts, Communities, Users
- Posts tab: list of PostCard components matching query
- Communities tab: list of community cards with join button
- Users tab: list of user avatars + usernames with link to profile
- Empty state: "No results found for '{query}'"
- Uses `api.search.posts.useQuery`, `api.search.communities.useQuery`, `api.search.users.useQuery`

### 3.5 Explore Page
- File: `src/app/explore/page.tsx` (new)
- "Trending Communities" section: top 10 communities by member count
- "Popular Posts" section: top 10 posts by score in last 24 hours
- Uses `api.search.trending.useQuery`
- Public — no login required

### 3.6 Trending Widget
- File: `src/components/trending-widget.tsx` (new)
- Right sidebar component
- Shows top 5 trending communities
- "View all" link to `/explore`

## 4. Database / Data Changes

- Add GIN full-text search indexes on posts, communities, users
- Migration via `pnpm db:generate` + `pnpm db:push`

## 5. Files Likely Touched

- `src/server/db/schema.ts` — add GIN index definitions
- `src/server/api/routers/search.ts` — new, search router
- `src/server/api/root.ts` — register search router
- `src/components/search-bar.tsx` — new
- `src/app/search/page.tsx` — new
- `src/app/explore/page.tsx` — new
- `src/components/trending-widget.tsx` — new
- `src/components/layout/app-shell.tsx` — add search bar and trending widget

## 6. Acceptance Criteria / QA Checklist

- [ ] Search bar is visible in the layout
- [ ] Searching for a keyword returns matching posts, communities, and users
- [ ] Search results tabs (Posts, Communities, Users) work independently
- [ ] Empty search shows "No results found" message
- [ ] Explore page shows trending communities and popular posts
- [ ] Trending widget in right sidebar shows top communities
- [ ] Search works without login (public)
- [ ] Full-text search indexes are applied (verify via Neon)
- [ ] `pnpm check` and `pnpm build` pass
- [ ] All UI uses shadcn semantic tokens

## 7. Open Questions

1. Use PostgreSQL full-text search (`to_tsvector`) or simple `ILIKE`? **Recommendation: `ILIKE` for communities and users (short text), `to_tsvector` for posts (longer text).**
2. Should search support fuzzy matching? **Recommendation: no for launch.** Exact substring + FTS is sufficient.

## 8. Skills to Load

- **`backend-patterns`** — for search query optimization, pagination, N+1 prevention
- **`database-schema-design`** — for GIN index design, full-text search index patterns

## 9. MCP Tools to Use

- **Neon MCP** — `neon_run_sql` to verify GIN indexes are created; `neon_explain_sql_statement` to analyze search query performance and verify indexes are used
- **Context7 MCP** — query Drizzle docs for raw SQL expressions in index definitions, `sql` template tag usage
- **Playwright MCP** — type in search bar, submit, verify results page renders with correct tabs, test empty search, navigate to `/explore`