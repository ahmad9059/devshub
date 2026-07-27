# Phase 10 — Production Hardening

Covers: SEO metadata, sitemap, robots.txt, error boundaries, 404/500 pages, performance audit, deployment config, final E2E QA
Issue register rows owned: 11, 12

---

## 1. Goal

Harden the application for production: add SEO metadata, sitemap, and robots.txt. Implement error boundaries and custom 404/500 pages. Audit performance (Lighthouse). Configure deployment for Vercel. Run final end-to-end QA across all phases.

## 2. Scope

### In Scope
1. SEO metadata for all public pages (title, description, OpenGraph)
2. Dynamic sitemap (`/sitemap.ts`)
3. `robots.txt` (`/robots.ts`)
4. Error boundary (`error.tsx`)
5. Not-found page (`not-found.tsx`)
6. Loading states (`loading.tsx`)
7. Performance audit (Lighthouse, bundle analysis)
8. Vercel deployment configuration
9. Final end-to-end QA across all user flows
10. Environment variable validation for production
11. Security headers in `next.config.js`

### Out Of Scope
- Load testing (deferred)
- CDN configuration (Vercel handles this)
- Database connection pooling migration (Neon HTTP is sufficient for launch)
- Monitoring / observability tools (Sentry, LogRocket) — deferred

## 3. Detailed Tasks

### 3.1 SEO Metadata
- File: `src/app/layout.tsx` — update `metadata` with OpenGraph, Twitter card, canonical URL
- File: `src/app/page.tsx` — add `generateMetadata()` for home feed
- File: `src/app/community/[slug]/page.tsx` — `generateMetadata()` with community name + description
- File: `src/app/community/[slug]/post/[id]/page.tsx` — `generateMetadata()` with post title
- File: `src/app/user/[username]/page.tsx` — `generateMetadata()` with username
- Use `Metadata` type from `next`

### 3.2 Sitemap
- File: `src/app/sitemap.ts` (new)
- Dynamic sitemap: home, explore, policy, all communities, top posts, user profiles
- Use `MetadataRoute.Sitemap` type
- Fetch communities and posts from database (limit to recent 1000)
- Set `changeFrequency` and `priority` appropriately

### 3.3 Robots.txt
- File: `src/app/robots.ts` (new)
- Allow all public pages
- Disallow: `/settings`, `/onboarding`, `/submit`, `/api/*`
- Reference sitemap URL

### 3.4 Error Boundary
- File: `src/app/error.tsx` (new, client component)
- shadcn `Card`, `Button`, `Alert`
- Show error message + "Try again" button (calls `reset()`)
- Log error to console in production

### 3.5 Not-Found Page
- File: `src/app/not-found.tsx` (new)
- shadcn `Card`, `Button`
- "Page not found" message + link to home
- Styled with semantic tokens

### 3.6 Loading States
- File: `src/app/loading.tsx` (new) — global loading skeleton
- File: `src/app/community/[slug]/loading.tsx` (new) — community page skeleton
- File: `src/app/community/[slug]/post/[id]/loading.tsx` (new) — post detail skeleton
- Use shadcn `Skeleton` components

### 3.7 Security Headers
- File: `next.config.js` (update)
- Add `headers()` for:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy` (basic, allow shadcn/tailwind)

### 3.8 Performance Audit
- Run `pnpm build` and inspect bundle size
- Run Lighthouse via Playwright MCP on key pages
- Check: LCP < 2.5s, CLS < 0.1, FID < 100ms
- Optimize: lazy-load heavy components, use `next/image` for all images, prefetch feed data

### 3.9 Vercel Deployment Config
- File: `vercel.json` (new, if needed) or use Vercel dashboard
- Set all environment variables in Vercel project settings
- Configure: `SKIP_ENV_VALIDATION=false`, `NODE_ENV=production`
- Set up Neon production branch connection string as `DATABASE_URL`
- Set up S3 bucket and IAM credentials
- Set up OAuth redirect URLs for production domain

### 3.10 Final E2E QA
- Comprehensive test of all user flows:
  1. Sign up with email/password → onboarding → set username → home feed
  2. Sign up with Google → onboarding → set username → home feed
  3. Sign up with GitHub → onboarding → set username → home feed
  4. Create community → create post → view post → comment → reply
  5. Upvote/downvote post and comment → verify score
  6. Join community → leave community
  7. Search for posts, communities, users
  8. Report a post → moderator resolves
  9. Delete own post → verify soft delete
  10. View profile → edit profile → change avatar
  11. Toggle dark/light theme
  12. Mobile layout at 375px
  13. Desktop layout at 1440px

## 4. Database / Data Changes

- None — all schema work done in prior phases

## 5. Files Likely Touched

- `src/app/layout.tsx` — update metadata
- `src/app/page.tsx` — add generateMetadata
- `src/app/community/[slug]/page.tsx` — add generateMetadata
- `src/app/community/[slug]/post/[id]/page.tsx` — add generateMetadata
- `src/app/user/[username]/page.tsx` — add generateMetadata
- `src/app/sitemap.ts` — new
- `src/app/robots.ts` — new
- `src/app/error.tsx` — new
- `src/app/not-found.tsx` — new
- `src/app/loading.tsx` — new
- `src/app/community/[slug]/loading.tsx` — new
- `src/app/community/[slug]/post/[id]/loading.tsx` — new
- `next.config.js` — add security headers
- `vercel.json` — new (if needed)

## 6. Acceptance Criteria / QA Checklist

- [ ] All public pages have unique SEO metadata (title, description, OG)
- [ ] Sitemap at `/sitemap.xml` lists all public URLs
- [ ] `robots.txt` at `/robots.txt` allows public, disallows private
- [ ] Error boundary catches runtime errors and shows recovery UI
- [ ] 404 page renders for non-existent routes
- [ ] Loading skeletons show during data fetch
- [ ] Security headers present in response (verify via browser devtools)
- [ ] Lighthouse score: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 90
- [ ] All 13 E2E user flows pass
- [ ] `pnpm check` and `pnpm build` pass
- [ ] Production build deploys to Vercel successfully
- [ ] OAuth redirect URLs configured for production domain
- [ ] All env vars set in Vercel
- [ ] No console errors in production build
- [ ] All UI uses shadcn semantic tokens — no hardcoded colors

## 7. Open Questions

1. Should we use `next-sitemap` or Next.js native `sitemap.ts`? **Recommendation: native `sitemap.ts`** — built into Next.js 16, no extra dependency.
2. Should we add Sentry for error monitoring? **Recommendation: deferred** — add post-launch if needed.

## 8. Skills to Load

- **`ui-ux-pro-max`** — for final UI/UX audit, accessibility checklist, responsive design verification, pre-delivery checklist
- **`web-design-guidelines`** — for final UI compliance review against web interface guidelines
- **`devops-engineer`** — for deployment configuration, CI/CD, security headers, Vercel setup

## 9. MCP Tools to Use

- **Playwright MCP** — run all 13 E2E user flows; take screenshots at 375px and 1440px; run Lighthouse audit; verify SEO meta tags in page source; verify security headers in network responses
- **Neon MCP** — `neon_describe_project` to verify production database config; `neon_list_branch_computes` to verify production compute is running
- **Context7 MCP** — query Next.js 16 docs for `sitemap.ts`, `robots.ts`, `error.tsx`, `not-found.tsx`, `loading.tsx`, `generateMetadata()`, security headers in `next.config.js`