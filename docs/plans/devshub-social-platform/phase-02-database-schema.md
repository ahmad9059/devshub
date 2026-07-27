# Phase 2 — Database Schema

Covers: Core domain schema (communities, posts, comments, votes, memberships), Drizzle relations, indexes, migrations, seed data
Issue register rows owned: 7, 8, 15

---

## 1. Goal

Define the complete PostgreSQL schema for the social platform: communities, community memberships, posts, comments, votes, and all supporting relations. Generate and apply Drizzle migrations. Seed initial data for local development.

## 2. Scope

### In Scope
1. Design and implement `communities` table
2. Design and implement `community_members` table (join table)
3. Design and implement `posts` table (text + image)
4. Design and implement `comments` table (self-referencing for nesting)
5. Design and implement `votes` table (polymorphic: posts + comments)
6. Add Drizzle relations for type-safe joins
7. Add indexes for query performance (feed, search, user lookups)
8. Generate and apply migration
9. Create seed script for local development
10. Update `drizzle.config.ts` if needed

### Out Of Scope
- User profiles schema (Phase 3 — add `username`, `bio`, `avatar_object_key` to existing `users` table)
- Search indexes (Phase 8 — full-text search GIN indexes)
- Moderation tables (Phase 9 — reports, moderator roles)

## 3. Detailed Tasks

### 3.1 Communities Table
- File: `src/server/db/schema.ts`
- `devshub_communities`:
  - `id` uuid PK
  - `slug` varchar(50) unique not null (URL-safe, lowercase)
  - `name` varchar(100) not null
  - `description` text
  - `icon_object_key` text (S3 key for community icon, nullable)
  - `owner_id` uuid references `devshub_users(id)` on delete cascade
  - `member_count` integer default 0 not null
  - `post_count` integer default 0 not null
  - `createdAt` timestamptz default now
  - `updatedAt` timestamptz
- Indexes: `slug` (unique), `owner_id`, `createdAt` desc

### 3.2 Community Members Table
- `devshub_community_members`:
  - `community_id` uuid references `devshub_communities(id)` on delete cascade
  - `user_id` uuid references `devshub_users(id)` on delete cascade
  - `role` varchar(20) default 'member' not null (values: 'member', 'moderator', 'owner')
  - `joined_at` timestamptz default now
  - PK: composite (community_id, user_id)
- Indexes: `user_id` (for "my communities" query), `community_id`

### 3.3 Posts Table
- `devshub_posts`:
  - `id` uuid PK
  - `community_id` uuid references `devshub_communities(id)` on delete cascade
  - `author_id` uuid references `devshub_users(id)` on delete cascade
  - `title` varchar(300) not null
  - `body` text (markdown content, nullable for link-only posts in future)
  - `image_object_key` text (nullable — S3 key for image posts)
  - `score` integer default 0 not null (denormalized vote count)
  - `comment_count` integer default 0 not null
  - `deleted_at` timestamptz (soft delete)
  - `createdAt` timestamptz default now
  - `updatedAt` timestamptz
- Indexes: `community_id` + `createdAt` desc (community feed), `author_id` (user posts), `score` desc (top), `createdAt` desc (home feed)

### 3.4 Comments Table
- `devshub_comments`:
  - `id` uuid PK
  - `post_id` uuid references `devshub_posts(id)` on delete cascade
  - `author_id` uuid references `devshub_users(id)` on delete cascade
  - `parent_comment_id` uuid references `devshub_comments(id)` on delete cascade (nullable for top-level)
  - `body` text not null
  - `score` integer default 0 not null
  - `depth` smallint default 0 not null (0 = top-level, max 5)
  - `deleted_at` timestamptz (soft delete)
  - `createdAt` timestamptz default now
  - `updatedAt` timestamptz
- Indexes: `post_id` + `createdAt` (post comments), `author_id`, `parent_comment_id`

### 3.5 Votes Table
- `devshub_votes`:
  - `id` uuid PK
  - `user_id` uuid references `devshub_users(id)` on delete cascade
  - `target_type` varchar(10) not null ('post' | 'comment')
  - `target_id` uuid not null (polymorphic — no FK, validated in app)
  - `value` smallint not null (1 = upvote, -1 = downvote)
  - `createdAt` timestamptz default now
  - Unique: (user_id, target_type, target_id) — one vote per user per target
- Indexes: unique composite, `target_id` + `target_type`

### 3.6 Drizzle Relations
- File: `src/server/db/relations.ts` (new) or inline in `schema.ts`
- Define `relations()` for: users → posts, users → comments, users → votes, communities → posts, communities → members, posts → comments, comments → comments (self-ref)
- This enables `db.query.posts.findMany({ with: { author: true, community: true } })`

### 3.7 Migration
- Run `pnpm db:generate` to create migration SQL
- Review generated SQL in `drizzle/` folder
- Test on Neon dev branch first (Neon MCP `neon_create_branch`)
- Apply with `pnpm db:push` (dev) or `pnpm db:migrate` (production)

### 3.8 Seed Script
- File: `src/server/db/seed.ts` (new)
- Create 3 test users, 2 communities, 5 posts, 10 comments, votes
- Run with `npx tsx src/server/db/seed.ts`
- Add `db:seed` script to `package.json`

## 4. Database / Data Changes

- New tables: `devshub_communities`, `devshub_community_members`, `devshub_posts`, `devshub_comments`, `devshub_votes`
- All use `devshub_` prefix
- All have UUID PKs, `createdAt`/`updatedAt` timestamps
- Soft delete on posts and comments (`deleted_at`)
- Denormalized counters (`score`, `comment_count`, `member_count`, `post_count`) for read performance

## 5. Files Likely Touched

- `src/server/db/schema.ts` — add all domain tables
- `src/server/db/relations.ts` — new, Drizzle relations
- `src/server/db/seed.ts` — new, seed script
- `drizzle/` — generated migration files
- `package.json` — add `db:seed` script
- `drizzle.config.ts` — no changes expected (already configured)

## 6. Acceptance Criteria / QA Checklist

- [ ] `pnpm db:generate` produces clean migration SQL with no errors
- [ ] `pnpm db:push` applies successfully to Neon dev branch
- [ ] All tables visible in Neon console or Drizzle Studio
- [ ] `pnpm db:seed` inserts test data without errors
- [ ] Drizzle relations work: `db.query.posts.findMany({ with: { author: true } })` returns author data
- [ ] `pnpm check` passes
- [ ] `pnpm build` succeeds
- [ ] No raw SQL — all schema defined in Drizzle TypeScript

## 7. Open Questions

1. Should votes be polymorphic (single table for posts + comments) or separate tables? **Recommendation: polymorphic** — simpler, fewer tables, validated in app layer.
2. Should we use database triggers for denormalized counters or update them in application code? **Recommendation: application code** — Drizzle doesn't support triggers natively; update counters in the same transaction as the write.

## 8. Skills to Load

- **`database-schema-design`** — load before designing tables, relationships, indexes, constraints, normalization decisions
- **`backend-patterns`** — load for repository pattern, N+1 prevention, transaction patterns

## 9. MCP Tools to Use

- **Neon MCP** — `neon_create_branch` to create a dev branch for migration testing; `neon_run_sql` to verify table structure; `neon_describe_table_schema` to inspect generated tables; `neon_compare_database_schema` to diff dev vs main
- **Context7 MCP** — query Drizzle ORM docs for `relations()` API, polymorphic relations patterns, migration workflow