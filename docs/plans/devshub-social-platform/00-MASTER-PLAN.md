# DevsHub Social Platform — End-to-End Delivery Plan

> Status: Planning. Nothing in this scope has been implemented yet.
> Source: User prompt — "build a social platform for devs, like reddit, profiles, communities, minimalist, anyone can view but only logged-in users can post/comment, Google + GitHub + custom login, three-column layout, pure shadcn system"
> Output folder: `docs/plans/devshub-social-platform/`

---

## 0. How To Read This Plan

- **`00-MASTER-PLAN.md`** (this file) — current-state findings, cross-cutting rules, issue register, phase map, open questions.
- **`phase-01-*.md` through `phase-10-*.md`** — implementation-ready phase files with exact file paths, tasks, acceptance criteria, skills, and MCP guidance.
- **`QA-REPORT.md`** — living template for final verification.
- **`COMPLETION-REPORT.md`** — final-report template.

### Phase Consolidation Note

The user requested 12 phases. Per planning best practices (max 10 phases), related themes were consolidated into 10 coherent phases:

| Requested theme | Consolidated into |
|---|---|
| Auth + OAuth providers | Phase 1 (Auth Foundation) |
| Database schema + migrations | Phase 2 (Database Schema) |
| User profiles + avatar | Phase 3 (User Profiles) |
| Communities + membership | Phase 4 (Communities) |
| Posts + feed + three-column layout | Phase 5 (Posts & Feed) |
| Comments + nesting | Phase 6 (Comments & Replies) |
| Voting + ranking | Phase 7 (Voting & Ranking) |
| Search + discovery | Phase 8 (Search & Discovery) |
| Moderation + safety + rate limiting | Phase 9 (Moderation & Safety) |
| Production hardening + deploy + SEO | Phase 10 (Production Hardening) |

---

## 1. Current State Findings

### Stack (confirmed by codebase inspection)

| Layer | Technology | Evidence |
|---|---|---|
| Framework | Next.js 16.2.12 App Router, Turbopack | `package.json` |
| API | tRPC v11.4.3 + TanStack Query 5 | `src/server/api/trpc.ts`, `src/trpc/react.tsx` |
| ORM | Drizzle ORM 0.44.3 | `src/server/db/index.ts` |
| Database | Neon Postgres via `@neondatabase/serverless` HTTP driver | `src/server/db/index.ts` |
| Images | AWS S3 presigned uploads via `@aws-sdk/s3-request-presigner` | `src/server/s3.ts`, `src/server/api/routers/storage.ts` |
| UI | shadcn/ui `base-nova` preset, Tailwind v4, 17 components installed | `components.json`, `src/components/ui/` |
| Theming | `next-themes` dark-default, class-based | `src/components/theme-provider.tsx` |
| Env | T3 Env (`@t3-oss/env-nextjs`) | `src/env.js` |
| Lint | ESLint 9 flat config, `eslint-config-next` 16 | `eslint.config.js` |

### What Exists and Needs Hardening

| Area | State | Evidence |
|---|---|---|
| tRPC context | Exists, has `db` + `headers`, **no auth/session** | `src/server/api/trpc.ts` lines 7-10 |
| Storage router | Exists, `publicProcedure` (no auth gate) | `src/server/api/routers/storage.ts` |
| Drizzle schema | Exists, only `images` table | `src/server/db/schema.ts` |
| Design system | Exists, `/design-system` reference page, dark default | `src/app/design-system/page.tsx` |
| Theme toggle | Exists, working dropdown | `src/components/theme-toggle.tsx` |
| Root layout | Exists, ThemeProvider + TooltipProvider, **no TRPCReactProvider** | `src/app/layout.tsx` |
| Home page | Exists, minimal "Under construction" badge | `src/app/page.tsx` |

### What Is Greenfield (does not exist)

| Area | Notes |
|---|---|
| Authentication | No auth library installed. No `next-auth`, no `better-auth`, no session schema. |
| User accounts | No `users`, `accounts`, `sessions` tables. |
| User profiles | No profile page, no username, no avatar field. |
| Communities | No `communities`, `community_members` tables. |
| Posts | No `posts` table, no post creation UI, no feed. |
| Comments | No `comments` table, no nesting. |
| Votes | No `votes` table, no ranking. |
| Middleware | No `middleware.ts` for route protection. |
| TRPCReactProvider | Removed from layout to avoid server-only boundary; must be re-mounted per-page where client tRPC is needed. |
| Three-column layout | No layout shell exists. |
| Search | No search functionality. |
| Moderation | No moderation tools, roles, or reporting. |

### Key Architectural Decisions Already Made

1. **Neon HTTP driver** (`@neondatabase/serverless` + `drizzle-orm/neon-http`) — serverless-friendly, no persistent pool. All queries are HTTP-based. This is correct for Vercel/serverless deployment.
2. **S3 presigned uploads** — client uploads directly to S3 via a presigned URL from tRPC. The `storage.createImageUpload` mutation is currently `publicProcedure` and must be gated to authenticated users.
3. **shadcn `base-nova`** — components use `@base-ui/react` primitives (not Radix). The `render` prop pattern is used for composition, not `asChild`.
4. **Dark mode default** — `next-themes` with `defaultTheme="dark"`, `attribute="class"`.
5. **Table prefix** — all tables use `devshub_` prefix via `pgTableCreator`.

---

## 2. Cross-Cutting Rules

### Branch & Environment
- Work on a feature branch per phase. Merge to `main` only after phase acceptance criteria pass.
- Never commit `.env` files. Update `.env.example` for every new env var.
- Run `pnpm check` (lint + typecheck) before every commit.

### Database
- All schema changes via Drizzle migrations (`pnpm db:generate` then `pnpm db:push`).
- All tables use `devshub_` prefix.
- Use UUID primary keys (`defaultRandom()`).
- Include `createdAt` and `updatedAt` timestamps on all content tables.
- Test migrations on a Neon dev branch before applying to main.

### Security
- **Never expose AWS credentials or DATABASE_URL to client components.**
- Gate all write operations (post, comment, vote, upload) behind `protectedProcedure`.
- Public read access for feeds, communities, and profiles.
- Add Cloudflare Turnstile to auth forms (login, signup) to prevent bot abuse.
- Rate-limit write endpoints (post creation, commenting, voting) server-side.

### UI
- Follow `AGENTS.md` UI priority: shadcn registry first, custom only when no fit.
- Use semantic tokens (`bg-background`, `text-foreground`, `border-border`) — never hardcoded colors.
- Three-column layout: left sidebar (navigation/communities), center (feed/content), right sidebar (profile/info).
- Mobile: collapse to single column with bottom navigation or hamburger.
- All interactive elements must have visible focus states and keyboard support.

### MCP Usage
- Use **Neon MCP** for database branch creation, schema inspection, and migration testing.
- Use **Context7 MCP** for current library docs (Auth.js, Drizzle, tRPC, shadcn).
- Use **Playwright MCP** for end-to-end browser testing of each phase.
- Do NOT use Figma MCP unless a design file is provided.

### Skills Usage
- Each phase file specifies which skills to load before implementation.
- Skills provide patterns, checklists, and best practices that must be followed.

---

## 3. Issue Register

| # | Issue | Severity | Phase |
|---|---|---|---|
| 1 | No authentication system — all write endpoints are unprotected | P0 | 1 |
| 2 | `storage.createImageUpload` is `publicProcedure` — anyone can get presigned URLs | P0 | 1 |
| 3 | No user/session schema in database | P0 | 1-2 |
| 4 | No middleware for route protection | P0 | 1 |
| 5 | TRPCReactProvider not mounted — client tRPC mutations unavailable globally | P1 | 1 |
| 6 | No three-column layout shell | P1 | 5 |
| 7 | No post/comment/vote schema | P0 | 2 |
| 8 | No community schema or membership model | P0 | 2-4 |
| 9 | No rate limiting on write endpoints | P1 | 9 |
| 10 | No bot protection on auth forms | P1 | 1 |
| 11 | No SEO metadata, sitemap, or robots.txt | P2 | 10 |
| 12 | No error boundary or 404/500 pages | P2 | 10 |
| 13 | No search functionality | P2 | 8 |
| 14 | No moderation tools or content reporting | P1 | 9 |
| 15 | Neon HTTP driver has no connection pooling — each query is a separate HTTP request | P2 | 2 |

---

## 4. Phase Map

| Phase | Title | Scope Items | Depends On |
|---|---|---|---|
| 1 | Auth Foundation | Auth.js v5, Google/GitHub/Credentials providers, Drizzle adapter, session schema, tRPC auth context, protected procedure, middleware, login/signup UI, Turnstile | — |
| 2 | Database Schema | Users, profiles, communities, posts, comments, votes, memberships; Drizzle relations; indexes; migrations; seed data | 1 |
| 3 | User Profiles | Profile page, edit profile, avatar upload via S3, username selection, public profile view | 1, 2 |
| 4 | Communities | Create community, community page, join/leave, community listing, description/rules | 1, 2 |
| 5 | Posts & Feed | Three-column layout shell, create post (text/link/image), home feed, community feed, sorting, pagination | 2, 4 |
| 6 | Comments & Replies | Comment tree, nested replies, comment voting, comment author display | 2, 5 |
| 7 | Voting & Ranking | Upvote/downvote on posts and comments, hot ranking algorithm, score computation, vote deduplication | 2, 5, 6 |
| 8 | Search & Discovery | Full-text search posts/communities/users, trending, explore page | 2, 5 |
| 9 | Moderation & Safety | Community moderator roles, report content, delete own content, rate limiting, content policies | 1, 2, 4, 5 |
| 10 | Production Hardening | SEO metadata, sitemap, robots.txt, error boundaries, 404/500 pages, performance audit, deployment config, final E2E QA | 1-9 |

---

## 5. Out Of Scope

- Real-time notifications / WebSocket live updates (deferred to post-launch).
- Direct messaging between users.
- Admin dashboard / analytics panel.
- Mobile native apps (React Native / Flutter).
- Payment integration / premium tiers.
- Email sending (transactional emails for verification — deferred; OAuth handles email).
- Dark/light theme customization beyond the existing toggle.
- Internationalization (i18n) — English only for launch.
- Content moderation AI / automated filtering.
- Karma/reputation system beyond basic vote counts.

---

## 6. Open Questions / Decisions Needed

1. **Auth library choice**: Auth.js v5 (NextAuth) with Drizzle adapter is recommended. Alternative: Neon Auth (Better Auth) which branches with the database. **Recommendation: Auth.js v5** — most documented with tRPC, supports Google/GitHub/Credentials natively.
2. **Username format**: Should usernames be `@handle` style (lowercase, alphanumeric + hyphens) or allow more flexibility? **Recommendation: lowercase, 3-20 chars, alphanumeric + hyphens, no leading/trailing hyphens.**
3. **Community creation permissions**: Can any logged-in user create a community, or is there a karma threshold? **Recommendation: any logged-in user for launch.**
4. **Post types**: Text-only, or also link posts and image posts? **Recommendation: text + image (via existing S3 pipeline) for launch; link posts deferred.**
5. **Comment nesting depth**: Unlimited nesting or capped at N levels? **Recommendation: cap at 5 levels, then flat-thread.**
6. **Vote visibility**: Show exact vote counts or fuzzed counts (like Reddit)? **Recommendation: show exact counts for launch, fuzz later if abuse.**
7. **Content deletion**: Hard delete or soft delete (deleted_at)? **Recommendation: soft delete for posts/comments, hard delete for votes.**
8. **Rate limit strategy**: In-memory (not suitable for serverless) or Upstash Redis? **Recommendation: Upstash Redis for serverless compatibility.**

---

## 7. Next Step

Start with **Phase 1 — Auth Foundation**. It is the critical path: every subsequent phase depends on authenticated users, protected procedures, and session context. No write functionality can be built without it.