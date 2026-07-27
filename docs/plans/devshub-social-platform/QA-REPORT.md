# QA Report — DevsHub Social Platform

> Status: Not started. Fill this after implementation.

## What Was Reviewed

- [ ] Phase 1: Auth Foundation
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
- [ ] Google login works
- [ ] GitHub login works
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Logout works
- [ ] Unauthenticated redirect to /login works
- [ ] Turnstile renders on auth forms

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
- [ ] Three-column layout at 1440px
- [ ] Three-column layout at 1024px
- [ ] Single column at 768px
- [ ] Single column at 375px
- [ ] Dark mode default
- [ ] Light mode toggle works
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

## Remaining Friction Points

<!-- List any issues, tech debt, or friction discovered -->

## P0/P1/P2 Status

| Severity | Count | Resolved |
|---|---|---|
| P0 | | |
| P1 | | |
| P2 | | |

## Recommendations Before Production

<!-- List final recommendations -->
