# Phase 4 — Communities

Covers: Create community, community page, join/leave, community listing, description/rules
Issue register rows owned: 8 (community model)

---

## 1. Goal

Allow any authenticated user to create a community. Communities have a slug, name, description, and icon. Users can join and leave communities. A community page shows the community info and its posts. The home page shows a listing of popular communities.

## 2. Scope

### In Scope
1. Create community page (`/create-community`)
2. Community page (`/community/[slug]`) — info + posts feed
3. Join/leave community (tRPC mutation + UI button)
4. Community listing on home sidebar (left column)
5. Community settings (owner only) — edit name, description, icon
6. tRPC router for community CRUD and membership
7. Slug validation and uniqueness

### Out Of Scope
- Community moderation tools (Phase 9)
- Community rules display (Phase 9)
- Community analytics
- Private/restricted communities (deferred)

## 3. Detailed Tasks

### 3.1 Community tRPC Router
- File: `src/server/api/routers/community.ts` (new)
- `create` (protectedProcedure): input `{ slug, name, description }`, create community + add creator as owner in `community_members`, increment `member_count`
- `getBySlug` (publicProcedure): input `{ slug }`, return community with member count, post count
- `list` (publicProcedure): input `{ limit?, offset? }`, return communities sorted by member count
- `listMine` (protectedProcedure): return communities the current user has joined
- `join` (protectedProcedure): input `{ community_id }`, insert into `community_members`, increment `member_count`
- `leave` (protectedProcedure): input `{ community_id }`, delete from `community_members`, decrement `member_count`
- `update` (protectedProcedure): input `{ community_id, name?, description?, icon_object_key? }`, verify caller is owner/moderator, update
- `checkSlug` (publicProcedure): input `{ slug }`, return `{ available: boolean }`
- Register in `src/server/api/root.ts`

### 3.2 Slug Validation
- Zod: `z.string().min(3).max(30).regex(/^[a-z0-9-]+$/)`
- Lowercase, alphanumeric + hyphens
- Unique in database

### 3.3 Create Community Page
- File: `src/app/create-community/page.tsx` (new)
- Protected route
- shadcn: `Card`, `Input`, `Label`, `Textarea`, `Button`, `Alert`
- Slug input with real-time availability check
- Name, description fields
- Icon upload (optional, via S3 pipeline)
- On submit: `community.create` mutation → redirect to `/community/[slug]`

### 3.4 Community Page
- File: `src/app/community/[slug]/page.tsx` (new)
- Server component — fetch community data via tRPC server caller
- Header: community icon, name, description, member count, join/leave button
- Body: posts feed (reuse PostCard component from Phase 5, or placeholder if Phase 5 not done)
- If community not found: 404
- Public — no login required to view

### 3.5 Join/Leave Button
- File: `src/components/join-button.tsx` (new, client component)
- If logged in and not a member: "Join" button (shadcn `Button` default variant)
- If logged in and a member: "Joined" button (shadcn `Button` outline variant, click to leave with confirm)
- If not logged in: "Join" button that redirects to `/login`
- Uses `community.join` and `community.leave` mutations
- Optimistic update on click

### 3.6 Community Listing Component
- File: `src/components/community-list.tsx` (new)
- Fetches `community.list` — top communities by member count
- Renders as list of links with name, member count
- Used in left sidebar of three-column layout (Phase 5)

### 3.7 Community Settings Page
- File: `src/app/community/[slug]/settings/page.tsx` (new)
- Protected — only owner/moderator can access (check via tRPC)
- Edit name, description, icon
- Delete community (owner only, with confirmation dialog)

## 4. Database / Data Changes

- No new tables (schema defined in Phase 2)
- Application logic for `member_count` and `post_count` denormalized counters
- Update counters in same transaction as join/leave/create operations

## 5. Files Likely Touched

- `src/server/api/routers/community.ts` — new, community router
- `src/server/api/root.ts` — register community router
- `src/app/create-community/page.tsx` — new
- `src/app/community/[slug]/page.tsx` — new
- `src/app/community/[slug]/settings/page.tsx` — new
- `src/components/join-button.tsx` — new
- `src/components/community-list.tsx` — new

## 6. Acceptance Criteria / QA Checklist

- [x] Authenticated user can create a community with valid slug
- [x] Slug availability check works in real-time
- [x] Community page renders for any visitor at `/community/[slug]`
- [x] Join button works — user becomes member, member count increments
- [x] Leave button works — user removed, member count decrements
- [x] Non-existent community slug shows 404
- [x] Community settings only accessible to owner/moderator
- [x] `pnpm check` and `pnpm build` pass
- [x] All UI uses shadcn semantic tokens

## 7. Open Questions

1. Should community deletion be allowed? **Deferred** — settings page covers edit/icon; deletion not implemented (posts cascade-delete is schema-ready, but deletion UI deferred to Phase 9 moderation).
2. Should there be a limit on communities per user? **Resolved: 50 communities per user** — enforced server-side via `communityMembers` count check before create.
3. **Community prefix is `d/`** (e.g. `d/reactjs`), not `r/`, to match the DevsHub brand.

## 8. Skills to Load

- **`backend-patterns`** — for repository pattern, transaction handling for denormalized counters, error handling
- **`database-schema-design`** — for relation queries, join table patterns

## 9. MCP Tools to Use

- **Neon MCP** — `neon_run_sql` to verify `community_members` inserts and `member_count` updates; `neon_describe_table_schema` to inspect `devshub_communities`
- **Context7 MCP** — query Drizzle docs for transaction patterns, `db.insert().values().returning()`, composite PK queries
- **Playwright MCP** — navigate to `/create-community`, fill form, submit, verify redirect to community page, test join/leave button