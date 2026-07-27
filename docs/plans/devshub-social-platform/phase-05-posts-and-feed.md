# Phase 5 — Posts & Feed

Covers: Three-column layout shell, create post, home feed, community feed, sorting, pagination
Issue register rows owned: 6

---

## 1. Goal

Build the core Reddit-style three-column layout (left sidebar, center feed, right sidebar). Allow authenticated users to create text and image posts in communities. Display a home feed (all communities) and per-community feed with sorting (hot, new, top). Implement cursor-based pagination for infinite scroll.

## 2. Scope

### In Scope
1. Three-column layout shell (left/center/right)
2. Responsive: 3 columns on desktop, single column on mobile
3. Create post page (`/submit`) — select community, title, body (markdown), optional image
4. Post card component (reusable) — title, author, community, score, comment count, timestamp
5. Home feed (`/`) — all posts sorted by hot/new/top
6. Community feed (`/community/[slug]`) — posts in that community
7. Sorting tabs (Hot, New, Top)
8. Cursor-based pagination (infinite scroll via TanStack Query `useInfiniteQuery`)
9. Post detail page (`/community/[slug]/post/[id]`) — full post view
10. tRPC router for posts

### Out Of Scope
- Comments (Phase 6)
- Voting UI (Phase 7 — score is displayed but voting buttons added later)
- Search (Phase 8)
- User profile post listing (Phase 3 — already done, reuses PostCard)

## 3. Detailed Tasks

### 3.1 Three-Column Layout Shell
- File: `src/components/layout/app-shell.tsx` (new)
- Left column (desktop only, `lg:block`): community list, navigation links (Home, Popular, Create Community)
- Center column (flex-1): main content area
- Right column (desktop only, `xl:block`): user info / login button, theme toggle, about
- Mobile: single column, left sidebar collapses to a sheet or hamburger menu
- Use shadcn `Separator` between columns
- Wrap all pages in this shell via a layout component or per-page

### 3.2 Post tRPC Router
- File: `src/server/api/routers/post.ts` (new)
- `create` (protectedProcedure): input `{ community_id, title, body?, image_object_key? }`, validate community exists and user is a member, insert post, increment community `post_count`
- `getById` (publicProcedure): input `{ id }`, return post with author, community, vote relation for current user (if logged in)
- `list` (publicProcedure): input `{ sort: 'hot'|'new'|'top', community_slug?, cursor?, limit? }`, return paginated posts
- `listByUser` (publicProcedure): input `{ username, cursor?, limit? }`, return user's posts
- `delete` (protectedProcedure): input `{ id }`, verify ownership, soft delete (set `deleted_at`)
- `update` (protectedProcedure): input `{ id, title?, body? }`, verify ownership, update
- Register in `src/server/api/root.ts`

### 3.3 Sorting Algorithms
- **New**: `ORDER BY created_at DESC`
- **Hot**: `ORDER BY score DESC, created_at DESC` (simple for launch; can add time decay later)
- **Top**: `ORDER BY score DESC`
- All use cursor-based pagination (cursor = `created_at` or `score + created_at`)

### 3.4 Create Post Page
- File: `src/app/submit/page.tsx` (new)
- Protected route
- shadcn: `Card`, `Input`, `Label`, `Textarea`, `Button`, `Select`, `Alert`
- Community selector (shadcn `Select` — list of user's joined communities)
- Title input (max 300 chars)
- Body textarea (markdown — plain textarea for launch, no WYSIWYG)
- Image upload (optional — reuse S3 pipeline, show preview)
- Submit: `post.create` mutation → redirect to post detail page
- Validation: title required, community required, body or image required

### 3.5 Post Card Component
- File: `src/components/post-card.tsx` (new)
- Reusable card showing: title, community link, author link, timestamp, score, comment count
- shadcn `Card` with `CardHeader`, `CardContent`, `CardFooter`
- Click title → navigate to post detail page
- Vote arrows placeholder (added in Phase 7)
- Image thumbnail if post has image

### 3.6 Home Feed
- File: `src/app/page.tsx` (replace existing "Under construction")
- Use `AppShell` layout
- Sorting tabs (shadcn `Tabs`): Hot, New, Top
- Infinite scroll list of `PostCard` components
- Uses `api.post.list.useInfiniteQuery({ sort, limit: 10 })`
- "Create Post" button in right sidebar (if logged in) or "Login to post" (if not)

### 3.7 Community Feed
- File: `src/app/community/[slug]/page.tsx` (update from Phase 4)
- Add sorting tabs and infinite scroll post list
- Uses `api.post.list.useInfiniteQuery({ community_slug, sort })`

### 3.8 Post Detail Page
- File: `src/app/community/[slug]/post/[id]/page.tsx` (new)
- Full post view: title, body (rendered markdown), image (if any), author, community, score, timestamp
- Comment section placeholder (Phase 6)
- Edit/delete buttons if user is author

### 3.9 Markdown Rendering
- Install `react-markdown` + `remark-gfm`
- File: `src/components/markdown.tsx` (new) — render markdown with shadcn-compatible styling
- Sanitize with `rehype-sanitize` to prevent XSS

## 4. Database / Data Changes

- No new tables
- Application logic for `post_count` denormalized counter on community
- Application logic for `comment_count` on post (updated in Phase 6)

## 5. Files Likely Touched

- `src/components/layout/app-shell.tsx` — new, three-column layout
- `src/server/api/routers/post.ts` — new, post router
- `src/server/api/root.ts` — register post router
- `src/app/page.tsx` — replace with home feed
- `src/app/submit/page.tsx` — new, create post
- `src/app/community/[slug]/page.tsx` — update with feed
- `src/app/community/[slug]/post/[id]/page.tsx` — new, post detail
- `src/components/post-card.tsx` — new, reusable post card
- `src/components/markdown.tsx` — new, markdown renderer
- `package.json` — add react-markdown, remark-gfm, rehype-sanitize

## 6. Acceptance Criteria / QA Checklist

- [ ] Three-column layout renders on desktop (≥1024px): left sidebar, center feed, right sidebar
- [ ] Mobile (≤768px) renders single column with collapsed sidebar
- [ ] Authenticated user can create a post in a community they've joined
- [ ] Unauthenticated user sees "Login to post" instead of create button
- [ ] Home feed shows posts from all communities with infinite scroll
- [ ] Community feed shows only posts from that community
- [ ] Sorting tabs (Hot, New, Top) change the feed order
- [ ] Post detail page renders full post with markdown body
- [ ] Post author can delete their own post (soft delete)
- [ ] Deleted posts show "[deleted]" instead of content
- [ ] `pnpm check` and `pnpm build` pass
- [ ] All UI uses shadcn semantic tokens — no hardcoded colors

## 7. Open Questions

1. Should the home feed show posts from all communities or only joined communities? **Recommendation: all communities for launch** (like Reddit's "all" feed). Add "joined only" filter later.
2. Markdown or rich text editor? **Recommendation: plain markdown textarea for launch.** Add WYSIWYG later.

## 8. Skills to Load

- **`backend-patterns`** — for cursor-based pagination patterns, infinite query design, N+1 prevention in feed queries
- **`trpc`** — for `useInfiniteQuery` patterns, mutation invalidation, procedure organization
- **`ui-ux-pro-max`** — for three-column layout responsive design, card component patterns, feed UX guidelines

## 9. MCP Tools to Use

- **Context7 MCP** — query TanStack Query docs for `useInfiniteQuery` with tRPC, cursor pagination patterns; query react-markdown docs for GFM + sanitize configuration
- **Neon MCP** — `neon_run_sql` to verify post inserts and `post_count` counter updates
- **Playwright MCP** — test three-column layout at 1440px, 1024px, and 375px widths; create a post; verify infinite scroll; test sorting tabs