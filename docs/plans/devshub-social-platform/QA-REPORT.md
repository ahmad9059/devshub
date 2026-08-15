# QA Report — DevsHub Social Platform

> Status: Phases 1–6 completed and verified. Remaining phases pending.

## What Was Reviewed

- [x] Phase 1: Auth Foundation
- [x] Phase 2: Database Schema
- [x] Phase 3: User Profiles
- [x] Phase 4: Communities
- [x] Phase 5: Posts & Feed
- [x] Phase 6: Comments & Replies
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
- Phase 4 added community creation, community pages, join/leave, community list, and owner/moderator settings.
- Phase 5 added the three-column layout shell, post creation, home/community feeds with sorting + infinite scroll, markdown rendering, and the post detail page with edit/delete.
- Phase 6 added threaded comments: comment router (create/list/update/delete), recursive comment tree with indentation, comment input for top-level/replies, comment sorting (best/new/top), collapsible threads, soft-delete "[deleted]", and markdown in comments.

## Files Changed

- Phase 2: `src/server/db/schema.ts`, `src/server/db/relations.ts` (new), `src/server/db/seed.ts` (new), `src/server/db/index.ts`, `drizzle/0001_safe_thundra.sql`, `package.json` (`db:seed`, `tsx` dev dep).
- Phase 3: `src/server/db/schema.ts` (username/bio/avatarObjectKey/usernameUpdatedAt + post slug), `drizzle/0002_sad_green_goblin.sql` + `0003_needy_swordsman.sql` + `0004_tan_spitfire.sql`, `src/server/api/routers/profile.ts` (new), `src/server/api/routers/storage.ts` (getSignedDownloadUrl), `src/server/s3.ts`, `src/components/user-avatar.tsx`, `avatar-uploader.tsx`, `onboarding-guard.tsx`, `src/app/settings/page.tsx`, `onboarding/page.tsx`, `user/[username]/page.tsx`, `src/proxy.ts` (x-pathname + onboarding), `src/app/layout.tsx`.
- Phase 4: `src/server/api/routers/community.ts` (new), `src/server/api/root.ts` (register), `src/app/create-community/page.tsx` (new), `src/app/community/[slug]/page.tsx` (new), `src/app/community/[slug]/settings/page.tsx` (new), `src/components/join-button.tsx` (new), `community-list.tsx` (new), `image-upload-button.tsx` (new), `src/proxy.ts` (protect /create-community), `d/` prefix across community UI.
- Phase 5: `src/server/api/routers/post.ts` (new), `src/server/api/root.ts` (register), `src/components/layout/app-shell.tsx` (new, three-column), `src/components/post-card.tsx` (new), `src/components/post-feed.tsx` (new, infinite scroll + sort tabs), `src/components/markdown.tsx` (new), `src/components/post-actions.tsx` (new), `src/app/page.tsx` (home feed), `src/app/submit/page.tsx` + `submit-form.tsx` (new), `src/app/community/[slug]/page.tsx` (feed), `src/app/post/[slug]/page.tsx` (new, detail) + `edit/page.tsx` + `edit-post-form.tsx`, `package.json` (react-markdown, remark-gfm, rehype-sanitize).
- Phase 6: `src/server/api/routers/comment.ts` (new), `src/server/api/root.ts` (register), `src/components/comment-input.tsx` (new), `src/components/comment-card.tsx` (new), `src/components/comment-tree.tsx` (new), `src/app/post/[slug]/page.tsx` (comment section), `src/server/db/seed.ts` (corrected commentCount values).

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
- [x] Create community works (slug availability, name/description/icon, redirect to community page)
- [x] Community page renders (public: header, members/posts count, posts feed, `d/` prefix)
- [x] Join/leave works (optimistic Join/Joined/Confirm-leave, member count increments/decrements)
- [x] Community settings (owner/moderator) works — non-owner blocked with explanatory alert

### Post Flows
- [x] Create text post works (community selector, title, markdown body)
- [ ] Create image post works (S3 pipeline wired; image test not repeated this phase)
- [x] Home feed renders with infinite scroll (10 → 13 posts on scroll)
- [x] Community feed renders (only that community's posts)
- [x] Sorting tabs (Hot/New/Top) work
- [x] Post detail page renders (markdown body, author/community/score)
- [x] Post delete works (soft delete → 404 + excluded from feeds)
- [x] Post edit works (title/body update)

### Comment Flows
- [x] Top-level comment works (markdown body)
- [x] Reply (nested) works (inline reply form)
- [x] Comment tree indentation correct (recursive, guide line)
- [x] Comment sorting works (Best/New/Top tabs)
- [x] Comment delete shows [deleted] (author hidden + note)
- [x] Comment edit works (inline edit + Save)

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

## Community QA (Phase 4)

- [x] `community.create` — validates slug format + uniqueness, enforces 50-community limit, adds creator as owner (batched inserts with client-generated UUID)
- [x] `community.checkSlug` real-time availability
- [x] `community.getBySlug` public, with owner + posts (slug links)
- [x] `community.list` public, sorted by member count
- [x] `community.listMine` for authenticated user
- [x] `community.join`/`leave` — atomic member-count increments via `db.batch` (neon-http has no transactions); owner cannot leave
- [x] `community.update` — owner/moderator only, non-owner gets FORBIDDEN
- [x] `/create-community` protected (proxy redirects to `/login`)
- [x] `/community/[slug]` public; non-existent slug → 404
- [x] `/community/[slug]/settings` — non-owner blocked in UI
- [x] Join/leave UI: Join → Joined → Confirm leave? → Join (member count reflects state)
- [x] Community prefix is `d/` (e.g. `d/reactjs`), matching DevsHub brand
- [x] **Neon-http driver has NO transaction support** (`.transaction()` throws at runtime) — switched to `db.batch()` for multi-statement atomic ops

## Posts QA (Phase 5)

- [x] Three-column layout at 1440px (left nav + top communities, center feed, right user/about)
- [x] Single column at 375px (sidebars hidden)
- [x] Unauthenticated: header "Log in", right sidebar "Join DevsHub" card, `/submit` redirects to `/login`
- [x] `post.create` — membership required (FORBIDDEN otherwise), body-or-image required, community `postCount` incremented
- [x] `post.list` cursor pagination with Hot (score,createdAt), New (createdAt), Top (score) sorts
- [x] `post.getBySlug` returns author + community; deleted posts → NOT_FOUND (404)
- [x] `post.update`/`post.delete` — author-only (FORBIDDEN otherwise); soft delete via `deletedAt`
- [x] Deleted posts excluded from `post.list`, `post.listByUser`, community `getBySlug`, and profile queries (`isNull(deletedAt)` filters added)
- [x] Markdown rendering (GFM + sanitize): headings, bold/italic, lists, blockquote, code, links (target=_blank)
- [x] Infinite scroll verified (IntersectionObserver + `useInfiniteQuery` loaded page 2)
- [x] Edit/delete UI only visible to post author (Edit link + Delete confirm flow)
- [x] Community `Select` shows `d/slug` label (fixed raw-UUID display via `SelectValue` children-as-function)
- [x] Client pages that use `AppShell` refactored into server page + client form to avoid pulling the server-only graph into the client bundle

## Comments QA (Phase 6)

- [x] `comment.create` — post must exist (NOT_FOUND), parent must belong to same post, `depth` capped at 5 (`Math.min(parent.depth+1, 5)`), post `commentCount` incremented via `db.batch`
- [x] `comment.list` — single flat query + app-side tree assembly (group by `parentCommentId`), sorted by Best/New/Top
- [x] Depth cap verified: 6-deep reply chain produced depths [1..4, 5, 5] and depth-5 nodes render flat (no nesting)
- [x] `comment.update`/`comment.delete` — author-only (FORBIDDEN otherwise); soft delete sets `deletedAt` + body `"[deleted]"`
- [x] Deleted comments render "[deleted]" header + "This comment was deleted." note, author hidden; thread structure preserved
- [x] Collapsible threads (collapse/expand reply count button) verified
- [x] Unauthenticated: comments render, no input form; logged-in: "Add a comment…" input
- [x] Markdown in comments (bold, inline code) rendered via shared `Markdown` component
- [x] Comment mutations invalidate `comment.list` query via `utils.comment.list.invalidate({ postId })`
- [x] Seed `commentCount` values corrected to match actual comment rows

## Architecture Decisions (Phase 1)

- **Session strategy: JWT, not database.** Auth.js v5 beta is incompatible with the Credentials provider when using `session.strategy: "database"` — the sign-in returns a JWE cookie but no DB session row is created and `auth()` resolves to `null`. Switched to `session: { strategy: "jwt" }` with `jwt`/`session` callbacks exposing `session.user.id`. The Drizzle adapter is still installed and used for OAuth user/account storage.
- **Proxy file: `src/proxy.ts` (Next.js 16).** Next.js 16 renamed `middleware.ts` to `proxy.ts`; the file must live alongside `src/app` (not the repo root) and runs on the Node.js runtime. A stale `.next` cache prevents the proxy from being picked up — `rm -rf .next` resolves it.
- **Type-only import fix:** `src/trpc/react.tsx` uses full `import type` for `AppRouter` so the server-only graph (`s3.ts`) is not pulled into the client bundle.

## Remaining Friction Points

- OAuth (Google/GitHub) flows are configured with real credentials but not fully E2E-tested in a browser (would redirect to the provider).
- `AUTH_URL` currently set to `http://localhost:3001` in `.env` (project uses port 3001 locally).
- Voting UI not present (Phase 7); score is read-only on posts and comments.
- Image-post creation flow shares the verified S3 pipeline but wasn't re-tested via UI this phase.
- Community deletion UI not yet implemented (deferred to Phase 9 moderation).

## P0/P1/P2 Status
| Severity | Count | Resolved |
|---|---|---|
| P0 | 5 | 5 |
| P1 | 4 | 2 |
| P2 | 4 | 0 |

Phase 1 owned P0 issues 1, 2, 4, 5 and P1 issue 10 (bot protection) — resolved. Phase 2 owned P0 issues 7, 8 and P2 issue 15 (Neon HTTP: no pooling by design, no transactions → `db.batch()`). Phase 3 owned issue 3 (profile fields) — resolved. Phase 4 delivered the community model. Phase 5 delivered issue 6 (three-column layout shell). Phase 6 delivered threaded comments (no new issue-register rows). P1 issue 9 (rate limiting) remains for Phase 9.

## Recommendations Before Production

<!-- List final recommendations -->
