# Phase 1 — Auth Foundation

Covers: Authentication system, OAuth providers, session management, tRPC auth context, route protection, login/signup UI
Issue register rows owned: 1, 2, 4, 5, 10

---

## 1. Goal

Enable users to sign up and log in using Google, GitHub, or email/password (custom credentials). Establish the session-aware tRPC context so every subsequent phase can gate write operations behind `protectedProcedure`. Anyone can view content without logging in, but only authenticated users can post, comment, vote, or upload images.

## 2. Scope

### In Scope
1. Install and configure Auth.js v5 (NextAuth) with Drizzle adapter
2. Add Google, GitHub, and Credentials providers
3. Create auth schema tables (users, accounts, sessions, verificationTokens)
4. Wire `auth()` into tRPC context so procedures can access `ctx.session`
5. Create `protectedProcedure` middleware that throws `UNAUTHORIZED` if no session
6. Add Next.js middleware for route protection (redirect unauthenticated users from write pages)
7. Build login and signup pages using shadcn components
8. Add Cloudflare Turnstile to login/signup forms for bot protection
9. Gate the existing `storage.createImageUpload` mutation behind `protectedProcedure`
10. Re-mount `TRPCReactProvider` in the root layout (required for client-side mutations)
11. Add auth env vars to `.env.example` and `src/env.js`

### Out Of Scope
- User profile pages (Phase 3)
- Username selection flow (Phase 3)
- Avatar upload (Phase 3)
- Password reset / email verification (deferred — OAuth handles email)
- Rate limiting (Phase 9)

## 3. Detailed Tasks

### 3.1 Install Auth Dependencies
- `pnpm add next-auth@beta @auth/drizzle-adapter`
- `pnpm add -D @types/bcryptjs`
- `pnpm add bcryptjs` (for credentials password hashing)

### 3.2 Auth Schema (Drizzle)
- File: `src/server/db/schema.ts`
- Add tables: `users`, `accounts`, `sessions`, `verificationTokens` using Auth.js Drizzle adapter schema
- `users` table: `id` (uuid), `name`, `email` (unique), `emailVerified`, `image`, `createdAt`, `updatedAt`
- `accounts` table: standard Auth.js account schema (provider, providerAccountId, etc.)
- `sessions` table: standard Auth.js session schema
- Use `devshub_` prefix via existing `createTable` helper
- Run `pnpm db:generate` and `pnpm db:push` to apply

### 3.3 Auth Configuration
- File: `src/auth.ts` (new)
- Configure `NextAuth()` with:
  - `adapter: DrizzleAdapter(db)`
  - `session: { strategy: "database" }` (database sessions, not JWT — works with Drizzle adapter)
  - `providers: [Google, GitHub, Credentials]`
  - Credentials provider: validate email + bcrypt-hashed password against `users` table
  - `pages: { signIn: "/login" }`
- Export `{ handlers, auth, signIn, signOut }`

### 3.4 Auth API Route
- File: `src/app/api/auth/[...nextauth]/route.ts` (new)
- Export `GET` and `POST` from `handlers`

### 3.5 tRPC Auth Context
- File: `src/server/api/trpc.ts`
- Update `createTRPCContext` to call `auth()` and attach `session`
- Add `protectedProcedure` = `t.procedure.use(isAuthed)` middleware
- `isAuthed` middleware: check `ctx.session?.user`, throw `TRPCError({ code: "UNAUTHORIZED" })` if missing
- Export `protectedProcedure` alongside `publicProcedure`

### 3.6 Gate Storage Router
- File: `src/server/api/routers/storage.ts`
- Change `createImageUpload` from `publicProcedure` to `protectedProcedure`

### 3.7 Middleware
- File: `middleware.ts` (new, project root)
- Use `auth()` as middleware export
- Protect routes: `/profile`, `/settings`, `/create`, `/submit`
- Allow public access to: `/`, `/community/*`, `/user/*`, `/design-system`, `/login`, `/signup`

### 3.8 Re-mount TRPCReactProvider
- File: `src/app/layout.tsx`
- Wrap children with `<TRPCReactProvider>` inside `<ThemeProvider>`
- This was removed earlier to avoid server-only boundary; now that auth schema exists, the import graph is safe

### 3.9 Login Page
- File: `src/app/login/page.tsx` (new)
- shadcn components: `Card`, `Button`, `Input`, `Label`, `Separator`, `Alert`
- Google button (outline variant, Google icon)
- GitHub button (outline variant, GitHub icon)
- Separator with "or"
- Email + password form with Turnstile widget
- On submit: call `signIn("credentials", { email, password, redirect: true, callbackUrl: "/" })`
- Link to signup page
- Error display via `Alert` variant="destructive"

### 3.10 Signup Page
- File: `src/app/signup/page.tsx` (new)
- Same OAuth buttons as login
- Email + password + confirm password form with Turnstile
- On submit: create user via tRPC `auth.signup` mutation, then `signIn("credentials")`
- Password validation: min 8 chars, uppercase, lowercase, number, special

### 3.11 Auth tRPC Router
- File: `src/server/api/routers/auth.ts` (new)
- `signup` mutation (publicProcedure): validate input with Zod, hash password with bcrypt, create user, return user
- `getSession` query (publicProcedure): return `ctx.session`
- Register in `src/server/api/root.ts`

### 3.12 Turnstile Integration
- File: `src/components/turnstile.tsx` (new) — client component wrapping Turnstile widget
- Add `TURNSTILE_SITE_KEY` (client) and `TURNSTILE_SECRET_KEY` (server) to env
- Verify token server-side in the `signup` mutation

### 3.13 Environment Variables
- File: `src/env.js` — add:
  - `AUTH_SECRET` (server, min 32 chars)
  - `GOOGLE_CLIENT_ID` (server)
  - `GOOGLE_CLIENT_SECRET` (server)
  - `GITHUB_CLIENT_ID` (server)
  - `GITHUB_CLIENT_SECRET` (server)
  - `TURNSTILE_SITE_KEY` (client — prefix `NEXT_PUBLIC_`)
  - `TURNSTILE_SECRET_KEY` (server)
- File: `.env.example` — add all new vars with placeholder values

## 4. Database / Data Changes

- New tables: `devshub_users`, `devshub_accounts`, `devshub_sessions`, `devshub_verification_tokens`
- Migration: `pnpm db:generate` → review SQL → `pnpm db:push`
- Use Neon MCP to create a dev branch for migration testing before applying to main

## 5. Files Likely Touched

- `src/auth.ts` — new, Auth.js configuration
- `src/app/api/auth/[...nextauth]/route.ts` — new, auth API route
- `src/server/db/schema.ts` — add auth tables
- `src/server/api/trpc.ts` — add session to context, add protectedProcedure
- `src/server/api/routers/storage.ts` — gate behind protectedProcedure
- `src/server/api/routers/auth.ts` — new, signup mutation
- `src/server/api/root.ts` — register auth router
- `src/app/layout.tsx` — re-mount TRPCReactProvider
- `src/app/login/page.tsx` — new, login page
- `src/app/signup/page.tsx` — new, signup page
- `src/components/turnstile.tsx` — new, Turnstile widget
- `middleware.ts` — new, route protection
- `src/env.js` — add auth env vars
- `.env.example` — add auth env vars
- `package.json` — add next-auth, @auth/drizzle-adapter, bcryptjs

## 6. Acceptance Criteria / QA Checklist

- [ ] `pnpm check` passes (lint + typecheck)
- [ ] `pnpm build` succeeds
- [ ] Google login redirects to Google, returns with session
- [ ] GitHub login redirects to GitHub, returns with session
- [ ] Email/password signup creates a user in the database
- [ ] Email/password login establishes a session
- [ ] Unauthenticated user visiting `/profile` is redirected to `/login`
- [ ] Unauthenticated user can view `/` (home) without redirect
- [ ] `storage.createImageUpload` returns UNAUTHORIZED for unauthenticated callers
- [ ] Turnstile widget renders on login and signup pages
- [ ] No hardcoded colors — all shadcn semantic tokens
- [ ] Dark mode is default; login/signup pages render correctly in dark and light

## 7. Open Questions

1. Should we use database sessions or JWT sessions? **Recommendation: database sessions** — works natively with Drizzle adapter and Neon.
2. Should signup require email verification? **Recommendation: no for launch** — OAuth providers handle email; credentials provider is secondary.

## 8. Skills to Load

- **`authentication-setup`** — load before implementing auth schema, password hashing, JWT/session patterns, OAuth provider setup
- **`backend-patterns`** — load before implementing tRPC middleware, error handling, context creation

## 9. MCP Tools to Use

- **Context7 MCP** — query Auth.js v5 docs for Drizzle adapter setup, Google/GitHub provider configuration, middleware patterns
- **Neon MCP** — create a dev branch (`neon_create_branch`) to test the auth schema migration before applying to main; use `neon_run_sql` to verify tables were created
- **Playwright MCP** — after implementation, navigate to `/login` and `/signup`, verify OAuth buttons render, verify form submission, verify redirect behavior for unauthenticated users