# Phase 9 — Moderation & Safety

Covers: Community moderator roles, report content, delete own content, rate limiting, content policies
Issue register rows owned: 9, 14

---

## 1. Goal

Enable community owners and moderators to manage content in their communities. Allow users to report posts and comments. Implement server-side rate limiting on write endpoints to prevent spam and abuse. Add basic content policies and a report flow.

## 2. Scope

### In Scope
1. Moderator role in `community_members` (already in schema — `role: 'moderator'`)
2. Moderator actions: delete posts/comments in their community, remove member
3. Report content system (reports table + tRPC router + UI)
4. Rate limiting on write endpoints (post creation, commenting, voting)
5. Content policy page (`/policy`)
6. Report flow UI (report button on posts/comments, report dialog)
7. Owner actions: promote/demote moderators, transfer ownership

### Out Of Scope
- Admin dashboard for global moderation (deferred)
- Automated content filtering / AI moderation (deferred)
- Ban system (IP bans, user bans) — deferred beyond community-level removal
- Appeal system — deferred
- Audit log — deferred

## 3. Detailed Tasks

### 3.1 Reports Table
- File: `src/server/db/schema.ts`
- `devshub_reports`:
  - `id` uuid PK
  - `reporter_id` uuid references `devshub_users(id)` on delete cascade
  - `target_type` varchar(10) not null ('post' | 'comment')
  - `target_id` uuid not null
  - `reason` varchar(20) not null ('spam', 'harassment', 'off-topic', 'other')
  - `details` text (optional explanation)
  - `status` varchar(20) default 'open' not null ('open', 'resolved', 'dismissed')
  - `resolved_by` uuid references `devshub_users(id)` (nullable)
  - `created_at` timestamptz default now
- Indexes: `target_type` + `target_id`, `status`, `created_at`
- Migration: `pnpm db:generate` + `pnpm db:push`

### 3.2 Report tRPC Router
- File: `src/server/api/routers/report.ts` (new)
- `create` (protectedProcedure): input `{ target_type, target_id, reason, details? }`, create report
- `listForCommunity` (protectedProcedure): input `{ community_slug }`, return reports for posts/comments in that community — only for moderators/owner
- `resolve` (protectedProcedure): input `{ report_id, status: 'resolved'|'dismissed' }`, verify moderator, update report
- Register in `src/server/api/root.ts`

### 3.3 Moderator Permissions
- File: `src/server/api/routers/post.ts` (update)
- Add `modDelete` (protectedProcedure): input `{ id, reason? }`, verify caller is moderator/owner of the post's community, soft delete post
- File: `src/server/api/routers/comment.ts` (update)
- Add `modDelete` (protectedProcedure): same pattern for comments
- File: `src/server/api/routers/community.ts` (update)
- Add `promoteModerator` (protectedProcedure): owner only, change member role to 'moderator'
- Add `demoteModerator` (protectedProcedure): owner only, change role to 'member'
- Add `removeMember` (protectedProcedure): moderator/owner only, delete membership

### 3.4 Rate Limiting
- Install `@upstash/redis` and `@upstash/ratelimit`
- File: `src/server/lib/ratelimit.ts` (new)
- Create rate limiters:
  - `postLimiter`: 5 posts per 10 minutes per user
  - `commentLimiter`: 20 comments per 10 minutes per user
  - `voteLimiter`: 100 votes per 10 minutes per user
- Apply in tRPC procedures: check rate limit before executing mutation, throw `TRPCError({ code: 'TOO_MANY_REQUESTS' })` if exceeded
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env

### 3.5 Report Dialog Component
- File: `src/components/report-dialog.tsx` (new, client component)
- shadcn `Dialog` (install via `pnpm dlx shadcn@latest add dialog`)
- Trigger: report button (lucide `FlagIcon`) on post cards and comment cards
- Form: reason select (shadcn `Select`), details textarea, submit button
- On submit: `report.create` mutation, close dialog, show success toast

### 3.6 Moderator Queue Page
- File: `src/app/community/[slug]/moderation/page.tsx` (new)
- Protected — only moderators/owner can access
- List of reports for this community with target content, reporter, reason, status
- Actions: resolve, dismiss, delete reported content
- Uses `api.report.listForCommunity.useQuery`

### 3.7 Content Policy Page
- File: `src/app/policy/page.tsx` (new)
- Static content: community guidelines, prohibited content, reporting policy
- shadcn `Card`, `Alert`, prose styling
- Public — no login required

## 4. Database / Data Changes

- New table: `devshub_reports`
- No changes to existing tables (moderator role already in `community_members.role`)

## 5. Files Likely Touched

- `src/server/db/schema.ts` — add reports table
- `src/server/api/routers/report.ts` — new
- `src/server/api/routers/post.ts` — add modDelete
- `src/server/api/routers/comment.ts` — add modDelete
- `src/server/api/routers/community.ts` — add moderator management
- `src/server/api/root.ts` — register report router
- `src/server/lib/ratelimit.ts` — new, rate limiting
- `src/components/report-dialog.tsx` — new
- `src/app/community/[slug]/moderation/page.tsx` — new
- `src/app/policy/page.tsx` — new
- `src/env.js` — add Upstash env vars
- `.env.example` — add Upstash env vars
- `package.json` — add @upstash/redis, @upstash/ratelimit, shadcn dialog

## 6. Acceptance Criteria / QA Checklist

- [x] User can report a post or comment via report dialog
- [x] Moderator can view reports in community moderation queue
- [x] Moderator can delete posts/comments in their community
- [x] Moderator can resolve or dismiss reports
- [x] Owner can promote/demote moderators
- [x] Owner can remove members from community
- [x] Rate limiting prevents exceeding 5 posts / 10 minutes
- [x] Rate limiting prevents exceeding 20 comments / 10 minutes
- [x] Rate limit returns clear error message
- [x] Content policy page renders at `/policy`
- [x] Non-moderator cannot access moderation queue
- [x] `pnpm check` and `pnpm build` pass
- [x] All UI uses shadcn semantic tokens

## 7. Open Questions

1. Should rate limiting use Upstash Redis or a simpler in-memory approach? **Resolved: Upstash Redis** (with an in-memory fallback so local dev works before credentials are set). Sliding-window limiter; env vars `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
2. Should reports be anonymous? **Resolved: no for launch** — moderators see who reported. Add anonymous later if needed.
3. **Note:** shadcn `dialog` component installed (base-nova preset).

## 8. Skills to Load

- **`authentication-setup`** — for role-based access control patterns, moderator permission checks
- **`backend-patterns`** — for rate limiting integration, middleware patterns, error handling for rate limit errors

## 9. MCP Tools to Use

- **Neon MCP** — `neon_run_sql` to verify reports table schema; `neon_describe_table_schema` to inspect `devshub_reports`
- **Context7 MCP** — query @upstash/ratelimit docs for tRPC integration patterns, sliding window vs fixed window
- **Playwright MCP** — report a post as regular user, log in as moderator, verify report appears in moderation queue, resolve report, test rate limiting by creating multiple posts rapidly