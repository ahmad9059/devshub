# QA Report — DevsHub Social Platform

> Status: Phases 1–3 completed and verified. Remaining phases pending.

## What Was Reviewed

- [x] Phase 1: Auth Foundation
- [x] Phase 2: Database Schema
- [x] Phase 3: User Profiles
- [ ] Phase 2: Database Schema
- [ ] Phase 3: User Profiles
- [ ] Phase 4: Communities
- [ ] Phase 5: Posts & Feed
- [ ] Phase 6: Comments & Replies
- [ ] Phase 7: Voting & Ranking
- [ ] Phase 8: Search & Discovery
- [ ] Phase 9: Moderation & Safety
- [ ] Phase 10: Production Hardening

## What Was Improved

- Phase 2 added the full domain schema and seed data (see "Migrations Added" below).
- Phase 3 added user profile fields, profile pages, avatar upload, and username onboarding.

## Files Changed

- Phase 2: `src/server/db/schema.ts`, `src/server/db/relations.ts` (new), `src/server/db/seed.ts` (new), `src/server/db/index.ts`, `drizzle/0001_safe_thundra.sql`, `package.json` (`db:seed`, `tsx` dev dep).
- Phase 3: `src/server/db/schema.ts` (username/bio/avatarObjectKey/usernameUpdatedAt), `drizzle/0002_sad_green_goblin.sql` + `drizzle/0003_needy_swordsman.sql`, `src/server/api/routers/profile.ts` (new), `src/server/api/routers/storage.ts` (getSignedDownloadUrl), `src/server/s3.ts` (getSignedDownloadUrl helper, WHEN_REQUIRED checksum), `src/components/user-avatar.tsx` (new), `src/components/avatar-uploader.tsx` (new), `src/components/onboarding-guard.tsx` (new), `src/app/settings/page.tsx` (new), `src/app/onboarding/page.tsx` (new), `src/app/user/[username]/page.tsx` (new), `src/proxy.ts` (x-pathname header + onboarding protection), `src/app/layout.tsx` (OnboardingGuard).

## Migrations Added

- `drizzle/0001_safe_thundra.sql` — creates `devshub_community`, `devshub_community_member`, `devshub_post`, `devshub_comment`, `devshub_vote` with FKs, composite/unique indexes, and a self-referencing FK on comments.
- `drizzle/0002_sad_green_goblin.sql` — adds `username` (unique), `bio`, `avatarObjectKey` to `devshub_user`.
- `drizzle/0003_needy_swordsman.sql` — adds `usernameUpdatedAt` to `devshub_user` (30-day rename rate limit).

## Architecture Decisions

- **Polymorphic votes**: single `devshub_votes` table with `targetType`/`targetId`; unique `(userId, targetType, targetId)` prevents duplicate votes.
- **Self-referencing comments FK** uses `foreignKey()` in the table config (inline `.references()` cannot self-reference in Drizzle).
- **CamelCase column names** used consistently with the existing Phase 1 schema (`createdAt`, `authorId`, etc.).
- **Denormalized counters** (`score`, `commentCount`, `memberCount`, `postCount`) updated in application code, per plan.
- **Seed script** intentionally wipes tables first (idempotent); the drizzle `enforce-delete-with-where` rule is disabled per-line for those resets.
- **`tsx` added as devDependency** to run the seed; the `db:seed` script loads `.env` via `--env-file=.env`.

## Manual QA Performed

### Auth Flows
- [ ] Google login works (requires real Google credentials)
- [ ] GitHub login works (requires real GitHub credentials)
- [x] Email/password signup works (server-side Turnstile + bcrypt verified via tRPC)
- [x] Email/password login works (verified end-to-end via Auth.js callback)
- [ ] Logout works
- [x] Unauthenticated redirect to /login works (proxy redirects /profile → /login)
- [x] Turnstile renders on auth forms (widget mounts; placeholder key produces expected 400020)
- [x] Auth providers registered (google, github, credentials listed in /api/auth/providers)

### Profile Flows
- [x] Username selection onboarding works (redirect + availability check + save)
- [x] Avatar upload works (S3 presigned upload → download URL → rendered on profile)
- [x] Public profile page renders (avatar, bio, joined date, posts/comments tabs, community badges)
- [x] Profile edit works (username with availability, bio, avatar via /settings)

### Community Flows
- [ ] Create community works
- [ ] Community page renders
- [ ] Join/leave works
- [ ] Community settings (owner) works

### Post Flows
- [ ] Create text post works
- [ ] Create image post works
- [ ] Home feed renders with infinite scroll
- [ ] Community feed renders
- [ ] Sorting tabs (Hot/New/Top) work
- [ ] Post detail page renders
- [ ] Post delete works

### Comment Flows
- [ ] Top-level comment works
- [ ] Reply (nested) works
- [ ] Comment tree indentation correct
- [ ] Comment sorting works
- [ ] Comment delete shows [deleted]
- [ ] Comment edit works

### Voting Flows
- [ ] Upvote post works
- [ ] Downvote post works
- [ ] Toggle vote off works
- [ ] Change vote works
- [ ] Vote state persists on reload
- [ ] Vote on comment works

### Search Flows
- [ ] Search posts works
- [ ] Search communities works
- [ ] Search users works
- [ ] Explore page renders
- [ ] Trending widget renders

### Moderation Flows
- [ ] Report post works
- [ ] Report comment works
- [ ] Moderator queue renders
- [ ] Moderator delete works
- [ ] Resolve/dismiss report works
- [ ] Rate limiting triggers on excess posts

### Layout & Responsive
- [x] Dark mode default
- [x] Light mode toggle works (login/signup pages render in both)
- [ ] System theme works

### SEO & Production
- [ ] SEO metadata on all pages
- [ ] Sitemap.xml renders
- [ ] Robots.txt renders
- [ ] 404 page renders
- [ ] Error boundary works
- [ ] Loading skeletons show
- [ ] Security headers present
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95

## Validation Commands

```
pnpm check     # lint + typecheck
pnpm build     # production build
pnpm format:check
pnpm db:seed   # seed local/dev database (tsx --env-file=.env)
```

## Database QA (Phase 2)

- [x] `pnpm db:generate` produces clean migration SQL
- [x] `pnpm db:push` applies successfully to Neon dev branch
- [x] All 5 new tables visible in Neon (`community`, `community_member`, `post`, `comment`, `vote`)
- [x] Polymorphic vote unique index present (`(userId, targetType, targetId)`)
- [x] Comments self-referencing FK present (`parentCommentId` → `comment.id`, cascade)
- [x] `pnpm db:seed` inserts 3 users, 2 communities, 5 posts, 10 comments, 10 votes, 6 memberships
- [x] Drizzle relations verified via `db.query`: post→author/community/comments, community→members(user)/posts, comment→replies (self-ref), user→votes/memberships

## Profile QA (Phase 3)

- [x] `username` unique + format validation (lowercase, alphanumeric + hyphens, 3–20 chars)
- [x] Real-time username availability via `profile.checkUsername` (debounced by query `enabled`)
- [x] 30-day username rename limit enforced server-side (`usernameUpdatedAt`)
- [x] `/settings` protected: unauthenticated → `/login?callbackUrl=%2Fsettings`
- [x] `/user/[username]` public: posts + comments tabs, community badges, joined date
- [x] Non-existent username → 404 (via `TRPCError NOT_FOUND` → `notFound()`)
- [x] Onboarding redirect: authed user without username → `/onboarding` (in root layout guard)
- [x] Signup end-to-end with real Turnstile key: user created, auto-login, onboarding redirect, username set, redirect home
- [x] Avatar pipeline: presigned PUT → S3 (200) → `updateProfile(avatarObjectKey)` → presigned GET → rendered in profile
- [x] `passwordHash` NOT exposed in any profile query (fixed; uses explicit safe column selection)
- [x] Duplicate-username check uses `and(eq, ne)` (fixed a bug where `&&` didn't combine SQL conditions)
- [x] Post URLs use SEO-friendly title slugs, not random IDs — `posts.slug` (unique) added; profile page links `/post/${slug}` (Phase 5 will render `/post/[slug]`)

## Architecture Decisions (Phase 1)

- **Session strategy: JWT, not database.** Auth.js v5 beta is incompatible with the Credentials provider when using `session.strategy: "database"` — the sign-in returns a JWE cookie but no DB session row is created and `auth()` resolves to `null`. Switched to `session: { strategy: "jwt" }` with `jwt`/`session` callbacks exposing `session.user.id`. The Drizzle adapter is still installed and used for OAuth user/account storage.
- **Proxy file: `src/proxy.ts` (Next.js 16).** Next.js 16 renamed `middleware.ts` to `proxy.ts`; the file must live alongside `src/app` (not the repo root) and runs on the Node.js runtime. A stale `.next` cache prevents the proxy from being picked up — `rm -rf .next` resolves it.
- **Type-only import fix:** `src/trpc/react.tsx` uses full `import type` for `AppRouter` so the server-only graph (`s3.ts`) is not pulled into the client bundle.

## Remaining Friction Points

- OAuth (Google/GitHub) flows are configured with real credentials but not fully E2E-tested in a browser (would redirect to the provider).
- `AUTH_URL` currently set to `http://localhost:3001` in `.env` (project uses port 3001 locally).
- Post detail pages (`/post/...`) don't exist yet — profile page links point to them (Phase 5).
- Post URLs will use title slugs for SEO (planned Phase 5; slug column added in Phase 3).

## P0/P1/P2 Status
| Severity | Count | Resolved |
|---|---|---|
| P0 | 5 | 5 |
| P1 | 4 | 2 |
| P2 | 4 | 0 |

Phase 1 owned P0 issues 1 (no auth), 2 (unprotected storage mutation), 4 (no route protection), 5 (TRPCReactProvider not mounted) and P1 issue 10 (bot protection) — resolved, with real Turnstile keys now verified E2E. Phase 2 owned P0 issues 7 (no post/comment/vote schema), 8 (no community schema) and P2 issue 15 (Neon HTTP driver) — resolved except issue 15 (HTTP driver has no pooling by design, acceptable for serverless). Phase 3 owned issue 3 (profile fields) — resolved: username/bio/avatar + pages. P1 count resolved moved to 2 (issue 5 TRPCReactProvider + issue 10 Turnstile).

## Recommendations Before Production

<!-- List final recommendations -->
