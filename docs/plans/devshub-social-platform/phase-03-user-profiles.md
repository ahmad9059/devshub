# Phase 3 — User Profiles

Covers: Profile page, edit profile, avatar upload, username selection, public profile view
Issue register rows owned: 3 (profile fields)

---

## 1. Goal

Allow authenticated users to set a username, bio, and avatar. Display a public profile page showing the user's posts, comments, and communities. The profile page is viewable by anyone (logged in or not), but only the owner can edit it.

## 2. Scope

### In Scope
1. Add `username`, `bio`, `avatar_object_key` columns to `devshub_users` table
2. Username selection flow (on first login or via settings)
3. Profile settings page (`/settings`) — edit username, bio, avatar
4. Avatar upload via existing S3 presigned URL pipeline
5. Public profile page (`/user/[username]`) — shows avatar, bio, post history, comment history
6. Username validation (unique, format rules)
7. tRPC router for profile queries and mutations

### Out Of Scope
- Following/followers system (deferred)
- Profile activity feed beyond posts and comments
- Profile customization (themes, banners) — deferred
- Email change (handled by OAuth provider)

## 3. Detailed Tasks

### 3.1 Schema Update
- File: `src/server/db/schema.ts`
- Add to `devshub_users`:
  - `username` varchar(20) unique (nullable until set)
  - `bio` text (nullable)
  - `avatar_object_key` text (nullable — S3 key)
- Run `pnpm db:generate` and `pnpm db:push`

### 3.2 Profile tRPC Router
- File: `src/server/api/routers/profile.ts` (new)
- `getByUsername` (publicProcedure): input `{ username: string }`, return user with posts and comments
- `getMe` (protectedProcedure): return current user's profile data
- `updateProfile` (protectedProcedure): input `{ username?, bio?, avatar_object_key? }`, validate, update
- `checkUsername` (publicProcedure): input `{ username: string }`, return `{ available: boolean }`
- Register in `src/server/api/root.ts`

### 3.3 Username Validation
- Zod schema: `z.string().min(3).max(20).regex(/^[a-z0-9-]+$/).regex(/^[a-z0-9]/).regex(/[a-z0-9]$/)`
- Lowercase, alphanumeric + hyphens, no leading/trailing hyphens
- Unique in database (case-insensitive)

### 3.4 Settings Page
- File: `src/app/settings/page.tsx` (new)
- Protected route (middleware redirects to `/login` if unauthenticated)
- shadcn components: `Card`, `Input`, `Label`, `Textarea`, `Button`, `Avatar`, `Separator`, `Alert`
- Username input with real-time availability check (debounced)
- Bio textarea (max 500 chars)
- Avatar upload: click avatar → file picker → request presigned URL from `storage.createImageUpload` → upload to S3 → save `object_key` via `profile.updateProfile`
- Save button calls `profile.updateProfile` mutation
- Success/error feedback via `Alert`

### 3.5 Username Onboarding
- File: `src/app/onboarding/page.tsx` (new)
- If user logs in without a username, redirect here
- Simple form: choose username, set avatar (optional)
- On submit: `profile.updateProfile` → redirect to `/`

### 3.6 Public Profile Page
- File: `src/app/user/[username]/page.tsx` (new)
- Server component — fetch user data via tRPC server caller
- Show: avatar, username, bio, joined date, post count, comment count
- Tabs (shadcn `Tabs`): "Posts" | "Comments"
- Posts tab: list of user's posts with community, score, comment count
- Comments tab: list of user's comments with post context
- If user not found: 404 page
- Public — no login required to view

### 3.7 Avatar Component
- File: `src/components/user-avatar.tsx` (new)
- Compose shadcn `Avatar` + `AvatarFallback` + `AvatarImage`
- If `avatar_object_key` exists, construct S3 URL (or use presigned GET URL)
- Fallback: first letter of username
- Reusable across the app

## 4. Database / Data Changes

- ALTER TABLE `devshub_users` ADD `username`, `bio`, `avatar_object_key`
- Migration via `pnpm db:generate` + `pnpm db:push`

## 5. Files Likely Touched

- `src/server/db/schema.ts` — add profile columns to users
- `src/server/api/routers/profile.ts` — new, profile router
- `src/server/api/root.ts` — register profile router
- `src/app/settings/page.tsx` — new, settings page
- `src/app/onboarding/page.tsx` — new, username onboarding
- `src/app/user/[username]/page.tsx` — new, public profile
- `src/components/user-avatar.tsx` — new, reusable avatar
- `src/server/api/routers/storage.ts` — may need a `getSignedDownloadUrl` query for avatar display

## 6. Acceptance Criteria / QA Checklist

- [x] User can set username in `/settings` — validation prevents invalid formats
- [x] Username availability check works in real-time (debounced)
- [x] Avatar upload works: file → S3 → displayed in settings and profile
- [x] Public profile page `/user/[username]` renders for any visitor
- [x] Profile page shows posts and comments tabs
- [x] Non-existent username shows 404
- [x] Unauthenticated user visiting `/settings` is redirected to `/login`
- [x] User without username is redirected to `/onboarding` after login
- [x] `pnpm check` and `pnpm build` pass
- [x] All UI uses shadcn semantic tokens — no hardcoded colors

## 7. Open Questions

1. Should avatars be served via presigned GET URLs or public CDN? **Resolved: presigned GET URLs** — S3 bucket stays private; `storage.getSignedDownloadUrl` returns a 1-hour presigned URL, resolved server-side on the public profile page and client-side (protected) on settings.
2. Should usernames be changeable after setting? **Resolved: yes, but rate-limited (once per 30 days)** — enforced server-side via `usernameUpdatedAt`; returns `FORBIDDEN` if within 30 days.

## 8. Skills to Load

- **`authentication-setup`** — for session-aware profile access patterns
- **`backend-patterns`** — for repository pattern, input validation, error handling in profile mutations

## 9. MCP Tools to Use

- **Neon MCP** — `neon_run_sql` to verify schema migration applied correctly; `neon_describe_table_schema` to inspect `devshub_users` columns
- **Context7 MCP** — query Drizzle docs for `update()` with partial input, unique constraint validation
- **Playwright MCP** — navigate to `/settings`, fill username, upload avatar, verify profile page renders at `/user/test-user`