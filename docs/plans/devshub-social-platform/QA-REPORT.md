# QA Report — DevsHub Social Platform

> Status: Phase 1 completed and verified. Remaining phases pending.

## What Was Reviewed

- [x] Phase 1: Auth Foundation
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

<!-- List improvements made during QA -->

## Files Changed

<!-- List files changed during QA fixes -->

## Migrations Added

<!-- List migrations added or modified -->

## Architecture Decisions

<!-- Record any architecture decisions made or changed during implementation -->

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
- [ ] Username selection onboarding works
- [ ] Avatar upload works
- [ ] Public profile page renders
- [ ] Profile edit works

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
```

## Architecture Decisions (Phase 1)

- **Session strategy: JWT, not database.** Auth.js v5 beta is incompatible with the Credentials provider when using `session.strategy: "database"` — the sign-in returns a JWE cookie but no DB session row is created and `auth()` resolves to `null`. Switched to `session: { strategy: "jwt" }` with `jwt`/`session` callbacks exposing `session.user.id`. The Drizzle adapter is still installed and used for OAuth user/account storage.
- **Proxy file: `src/proxy.ts` (Next.js 16).** Next.js 16 renamed `middleware.ts` to `proxy.ts`; the file must live alongside `src/app` (not the repo root) and runs on the Node.js runtime. A stale `.next` cache prevents the proxy from being picked up — `rm -rf .next` resolves it.
- **Type-only import fix:** `src/trpc/react.tsx` uses full `import type` for `AppRouter` so the server-only graph (`s3.ts`) is not pulled into the client bundle.

## Remaining Friction Points

- OAuth (Google/GitHub) flows are configured but untested — requires real client ID/secret values.
- Turnstile uses placeholder keys (`replace-me`) — swap in real keys before using auth forms.
- `AUTH_URL` currently set to `http://localhost:3001` in `.env` (project uses port 3001 locally).

## P0/P1/P2 Status

| Severity | Count | Resolved |
|---|---|---|
| P0 | 5 | 4 |
| P1 | 4 | 1 |
| P2 | 4 | 0 |

Phase 1 owns P0 issues 1 (no auth), 2 (unprotected storage mutation), 4 (no route protection), 5 (TRPCReactProvider not mounted), and P1 issues 5 and 10 (bot protection). All Phase 1 items are resolved except items requiring external credentials (OAuth providers) which are wired but need real keys.

## Recommendations Before Production

<!-- List final recommendations -->
