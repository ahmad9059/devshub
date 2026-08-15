# Phase 7 — Voting & Ranking

Covers: Upvote/downvote on posts and comments, hot ranking algorithm, score computation, vote deduplication
Issue register rows owned: none new (builds on Phase 2 schema)

---

## 1. Goal

Allow authenticated users to upvote or downvote posts and comments. Each user can vote once per item. The vote affects the item's `score` (denormalized counter). Implement a hot ranking algorithm for the "Hot" feed sort. Prevent duplicate votes and allow vote changes/removals.

## 2. Scope

### In Scope
1. Vote tRPC router (create, update, remove)
2. Vote button component (upvote/downvote arrows with score)
3. Score display on post cards and comment cards
4. Hot ranking algorithm (time-decay based)
5. Vote deduplication (unique constraint already in schema)
6. Optimistic UI updates on vote
7. `score` denormalized counter maintenance (increment/decrement on vote)
8. Vote state persistence (show user's current vote)

### Out Of Scope
- Vote fuzzing (obfuscating exact counts) — deferred
- Karma/reputation system — deferred
- Vote-based awards/badges — deferred

## 3. Detailed Tasks

### 3.1 Vote tRPC Router
- File: `src/server/api/routers/vote.ts` (new)
- `cast` (protectedProcedure): input `{ target_type: 'post'|'comment', target_id, value: 1|-1 }`
  - Check if existing vote exists for (user_id, target_type, target_id)
  - If no existing vote: insert vote, update target `score` by `value`
  - If existing vote with same value: remove vote (toggle off), update target `score` by `-value`
  - If existing vote with different value: update vote, update target `score` by `2 * value` (remove old, add new)
  - All in a transaction
- `getMyVote` (protectedProcedure): input `{ target_type, target_id }`, return current vote value or null
- `getMyVotes` (protectedProcedure): input `{ target_type, target_ids: string[] }`, return map of vote states (batch for feed rendering)
- Register in `src/server/api/root.ts`

### 3.2 Score Update Logic
- For posts: `UPDATE devshub_posts SET score = score + delta WHERE id = target_id`
- For comments: `UPDATE devshub_comments SET score = score + delta WHERE id = target_id`
- Execute in same transaction as vote insert/update/delete
- Use Drizzle transaction: `db.transaction(async (tx) => { ... })`

### 3.3 Vote Button Component
- File: `src/components/vote-button.tsx` (new, client component)
- Upvote arrow (lucide `ArrowBigUpIcon`) + score + downvote arrow (lucide `ArrowBigDownIcon`)
- Vertical layout for post cards (sidebar style), horizontal for comments
- States: not voted (muted), upvoted (primary color), downvoted (destructive color)
- Click: call `vote.cast` mutation with optimistic update
- If not logged in: redirect to `/login`
- Uses shadcn `Button` ghost variant for arrows

### 3.4 Hot Ranking Algorithm
- File: `src/server/api/routers/post.ts` (update `list` procedure)
- Hot score formula: `log10(max(abs(score), 1)) + (created_at_epoch - 1134028003) / 45000`
- This is Reddit's original hot algorithm (simplified)
- `ORDER BY hot_score DESC` for "hot" sort
- Compute `hot_score` in SQL or in application code per post
- For launch: can use `score DESC, created_at DESC` as simpler proxy, add real algorithm if time permits

### 3.5 Vote State in Feed
- When fetching posts/comments for feed, batch-fetch current user's vote states
- `post.list` and `comment.list` should include `myVote: 1 | -1 | null` for each item
- Use `getMyVotes` batch query or join in the list query itself

### 3.6 Update Post Card and Comment Card
- File: `src/components/post-card.tsx` — add `VoteButton` in left sidebar of card
- File: `src/components/comment-card.tsx` — add `VoteButton` inline

## 4. Database / Data Changes

- No new tables (votes table defined in Phase 2)
- Application logic for `score` counter maintenance
- Potential index: `devshub_votes` on `(user_id, target_type, target_id)` — already unique in schema

## 5. Files Likely Touched

- `src/server/api/routers/vote.ts` — new, vote router
- `src/server/api/root.ts` — register vote router
- `src/server/api/routers/post.ts` — update `list` to include vote state and hot ranking
- `src/server/api/routers/comment.ts` — update `list` to include vote state
- `src/components/vote-button.tsx` — new
- `src/components/post-card.tsx` — add vote button
- `src/components/comment-card.tsx` — add vote button

## 6. Acceptance Criteria / QA Checklist

- [x] Authenticated user can upvote a post — score increments, arrow highlights
- [x] Authenticated user can downvote a post — score decrements, arrow highlights
- [x] Clicking the same vote again removes it (toggle off) — score reverts
- [x] Changing vote from up to down updates score by -2
- [x] Unauthenticated user clicking vote is redirected to `/login`
- [x] Vote state persists across page reloads
- [x] Feed shows correct vote state for current user on each item
- [x] Hot sort orders posts by hot ranking algorithm
- [x] Duplicate votes are prevented (unique constraint)
- [x] Score counter is accurate after multiple vote changes
- [x] `pnpm check` and `pnpm build` pass
- [x] All UI uses shadcn semantic tokens

## 7. Open Questions

1. Should we implement the full Reddit hot algorithm or a simpler proxy? **Resolved: Reddit hot algorithm implemented** — `log10(max(|score|,1)) + (epoch - 1134028003) / 45000`, applied in application code for the "hot" sort (with the DB ordering as a stable tiebreaker base). Cursor pagination for hot uses the (score, createdAt) proxy consistently.
2. Should downvotes be allowed immediately or require minimum karma? **Resolved: allowed immediately for launch.**
3. **Note:** Neon HTTP has no transactions, so vote + score updates use `db.batch()`.

## 8. Skills to Load

- **`backend-patterns`** — for transaction patterns (vote + score update in same transaction), optimistic concurrency, error handling
- **`trpc`** — for optimistic update patterns with TanStack Query, mutation invalidation

## 9. MCP Tools to Use

- **Neon MCP** — `neon_run_sql` to verify vote inserts and score counter updates; `neon_explain_sql_statement` to analyze vote query performance
- **Context7 MCP** — query TanStack Query docs for optimistic update patterns, `onMutate` / `onError` rollback
- **Playwright MCP** — upvote a post, verify score increments, toggle off, change to downvote, verify score, reload page and verify persistence