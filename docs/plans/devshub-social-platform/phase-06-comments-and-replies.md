# Phase 6 — Comments & Replies

Covers: Comment tree, nested replies, comment voting, comment author display
Issue register rows owned: none new (builds on Phase 2 schema)

---

## 1. Goal

Allow authenticated users to comment on posts and reply to comments (nested up to 5 levels). Display a threaded comment tree under each post. Comments show author, timestamp, score, and reply button. Anyone can view comments; only logged-in users can post or reply.

## 2. Scope

### In Scope
1. Comment tRPC router (create, list, update, delete)
2. Threaded comment tree component (recursive)
3. Comment input form (top-level and reply)
4. Comment card component (author, body, score, timestamp, reply button)
5. Nesting depth cap (5 levels, then flat-thread)
6. Comment sorting (best, new, top)
7. Markdown rendering for comment bodies
8. Soft delete display ("[deleted]")
9. `comment_count` denormalized counter on posts

### Out Of Scope
- Voting UI on comments (Phase 7 — score displayed, vote buttons added)
- Comment editing history
- Comment awards/reactions
- Mention notifications (@user)

## 3. Detailed Tasks

### 3.1 Comment tRPC Router
- File: `src/server/api/routers/comment.ts` (new)
- `create` (protectedProcedure): input `{ post_id, body, parent_comment_id? }`, validate post exists, validate parent depth < 5 if parent provided, insert comment, increment post `comment_count`
- `list` (publicProcedure): input `{ post_id, sort: 'best'|'new'|'top' }`, return all comments for post with author data, nested structure built in app
- `update` (protectedProcedure): input `{ id, body }`, verify ownership, update
- `delete` (protectedProcedure): input `{ id }`, verify ownership, soft delete (set `deleted_at`, clear `body` to "[deleted]")
- Register in `src/server/api/root.ts`

### 3.2 Comment Tree Building
- Fetch all comments for a post flat (single query)
- Build tree in application code: group by `parent_comment_id`, recursive assembly
- Cap depth at 5: if `depth >= 5`, replies are flat (same level, not nested further)
- Sort: top-level by sort algorithm, replies by score or time

### 3.3 Comment Sorting
- **Best**: `score DESC, created_at ASC` (highest score, oldest first for ties)
- **New**: `created_at DESC`
- **Top**: `score DESC`

### 3.4 Comment Card Component
- File: `src/components/comment-card.tsx` (new)
- shadcn: `Card` (size sm), `Avatar` (small), `Button` (ghost, for reply), `Separator`
- Shows: author avatar + username link, timestamp, body (markdown), score, reply button
- Vote arrows placeholder (Phase 7)
- If `deleted_at` is set: show "[deleted]" instead of body, hide author
- Reply button toggles comment input form inline

### 3.5 Comment Input Form
- File: `src/components/comment-input.tsx` (new, client component)
- shadcn: `Textarea`, `Button`, `Alert`
- Markdown textarea
- Submit: `comment.create` mutation, invalidate `comment.list` query
- Used for both top-level comments and replies (with `parent_comment_id`)

### 3.6 Comment Tree Component
- File: `src/components/comment-tree.tsx` (new)
- Recursive component: renders `CommentCard` + children (replies)
- Indentation per depth level (left padding, `pl-4` per level, max 5 levels)
- Collapsible threads (click to collapse/expand)
- Sorting tabs at top (shadcn `Tabs`): Best, New, Top

### 3.7 Post Detail Page Update
- File: `src/app/community/[slug]/post/[id]/page.tsx` (update from Phase 5)
- Add comment section below post body
- Top-level comment input (if logged in)
- Comment tree with sorting tabs
- Comment count in post header

## 4. Database / Data Changes

- No new tables
- Application logic for `comment_count` denormalized counter on posts
- `depth` field computed on insert (parent depth + 1, or 0 if no parent)

## 5. Files Likely Touched

- `src/server/api/routers/comment.ts` — new, comment router
- `src/server/api/root.ts` — register comment router
- `src/components/comment-card.tsx` — new
- `src/components/comment-input.tsx` — new
- `src/components/comment-tree.tsx` — new
- `src/app/community/[slug]/post/[id]/page.tsx` — add comment section

## 6. Acceptance Criteria / QA Checklist

- [x] Authenticated user can post a top-level comment on any post
- [x] Authenticated user can reply to a comment (nested)
- [x] Comment tree renders with correct indentation up to 5 levels
- [x] Replies at depth 5+ are flat (not further nested)
- [x] Comment sorting (Best, New, Top) changes order
- [x] Comment author can delete their comment — shows "[deleted]"
- [x] Comment author can edit their comment
- [x] Unauthenticated user sees comments but no input form
- [x] `comment_count` on post increments on new comment
- [x] Markdown renders in comments (bold, links, code)
- [x] Collapsible threads work (click to collapse/expand)
- [x] `pnpm check` and `pnpm build` pass
- [x] All UI uses shadcn semantic tokens

## 7. Open Questions

1. Should comment editing be time-limited? **Resolved: no time limit for launch.** Add later if abuse.
2. Should deleted comments show "[deleted]" or be hidden entirely? **Resolved: show "[deleted]"** — preserves thread structure, like Reddit. Author is hidden and a "This comment was deleted." note is shown.
3. **Note:** post detail lives at `/post/[slug]` (Phase 5 decision), so the comment section was added there rather than the plan's `/community/[slug]/post/[id]`.

## 8. Skills to Load

- **`backend-patterns`** — for recursive tree building, N+1 prevention (single query + app-side tree assembly), transaction for counter updates
- **`trpc`** — for mutation invalidation patterns, query structure for nested data
- **`ui-ux-pro-max`** — for comment tree UX, indentation patterns, collapsible thread interaction

## 9. MCP Tools to Use

- **Context7 MCP** — query Drizzle docs for self-referencing relations, recursive query patterns; query TanStack Query for nested data invalidation
- **Neon MCP** — `neon_run_sql` to verify comment inserts, `depth` computation, `comment_count` counter updates
- **Playwright MCP** — navigate to post detail page, post a comment, reply to it, verify nesting and indentation, test sorting, test delete