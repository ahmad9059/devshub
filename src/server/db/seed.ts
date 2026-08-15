import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

import { env } from "~/env";
import {
  comments,
  communities,
  communityMembers,
  posts,
  users,
  votes,
} from "./schema";

const sql = neon(env.DATABASE_URL);
const db = drizzle({ client: sql });

const PASSWORD = "Seedpass123!";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding DevsHub database...");

  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(votes);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(comments);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(posts);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(communityMembers);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(communities);
  // eslint-disable-next-line drizzle/enforce-delete-with-where -- seed intentionally resets all domain tables
  await db.delete(users);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const [alice, bob, carol] = await db
    .insert(users)
    .values([
      {
        name: "Alice Developer",
        email: "alice@devshub.local",
        username: "alice",
        usernameUpdatedAt: new Date(),
        bio: "Frontend engineer. React enthusiast.",
        passwordHash,
      },
      {
        name: "Bob Coder",
        email: "bob@devshub.local",
        username: "bob",
        usernameUpdatedAt: new Date(),
        bio: "Backend & TypeScript developer.",
        passwordHash,
      },
      {
        name: "Carol Engineer",
        email: "carol@devshub.local",
        username: "carol",
        usernameUpdatedAt: new Date(),
        bio: "Systems engineer, tinkerer.",
        passwordHash,
      },
    ])
    .returning();

  const [reactjs, typescript] = await db
    .insert(communities)
    .values([
      {
        slug: "reactjs",
        name: "React",
        description:
          "Everything about React — components, hooks, ecosystem, and best practices.",
        ownerId: alice!.id,
        memberCount: 3,
        postCount: 3,
      },
      {
        slug: "typescript",
        name: "TypeScript",
        description:
          "TypeScript tips, type gymnastics, and the broader static-typing ecosystem.",
        ownerId: bob!.id,
        memberCount: 3,
        postCount: 2,
      },
    ])
    .returning();

  await db.insert(communityMembers).values([
    { communityId: reactjs!.id, userId: alice!.id, role: "owner" },
    { communityId: reactjs!.id, userId: bob!.id, role: "member" },
    { communityId: reactjs!.id, userId: carol!.id, role: "member" },
    { communityId: typescript!.id, userId: bob!.id, role: "owner" },
    { communityId: typescript!.id, userId: alice!.id, role: "member" },
    { communityId: typescript!.id, userId: carol!.id, role: "member" },
  ]);

  const [p1, p2, p3, p4, p5] = await db
    .insert(posts)
    .values([
      {
        communityId: reactjs!.id,
        authorId: alice!.id,
        title: "React 19: what changed and what's stable now",
        slug: slugify("React 19: what changed and what's stable now"),
        body: "React 19 shipped with Actions, useOptimistic, and the new compiler story. Here's what's safe to adopt today and what still needs care.",
        score: 42,
        commentCount: 2,
      },
      {
        communityId: reactjs!.id,
        authorId: bob!.id,
        title: "Server Components: when to use them, when not to",
        slug: slugify("Server Components: when to use them, when not to"),
        body: "Server Components are powerful but not always the answer. A practical guide to deciding between client and server rendering boundaries.",
        score: 27,
        commentCount: 1,
      },
      {
        communityId: reactjs!.id,
        authorId: carol!.id,
        title: "Do you still reach for Redux?",
        slug: slugify("Do you still reach for Redux?"),
        body: "With context, zustand, and other lighter options, do you still use Redux for new projects? Curious about the current consensus.",
        score: 15,
        commentCount: 1,
      },
      {
        communityId: typescript!.id,
        authorId: bob!.id,
        title: "Type-safe tRPC with Drizzle relations",
        slug: slugify("Type-safe tRPC with Drizzle relations"),
        body: "Combining tRPC v11 with Drizzle relational queries gives you end-to-end type safety with almost zero ceremony. Here's the setup.",
        score: 33,
        commentCount: 1,
      },
      {
        communityId: typescript!.id,
        authorId: carol!.id,
        title: "Type gymnastics: inferring union types from a tuple",
        slug: slugify("Type gymnastics: inferring union types from a tuple"),
        body: "A deep dive into template literal types and tuple inference for building exhaustive discriminated unions.",
        score: 19,
        commentCount: 1,
      },
    ])
    .returning();

  const [c1, c3, c4, c5, c7] = await db
    .insert(comments)
    .values([
      {
        postId: p1!.id,
        authorId: bob!.id,
        body: "Actions have been a game changer for forms. UseOptimistic still trips me up occasionally though.",
        parentCommentId: null,
        depth: 0,
        score: 8,
      },
      {
        postId: p2!.id,
        authorId: alice!.id,
        body: "Rule of thumb: if it's interactive-heavy and dynamic, keep it a client component. If it's mostly static, server components shine.",
        parentCommentId: null,
        depth: 0,
        score: 6,
      },
      {
        postId: p3!.id,
        authorId: alice!.id,
        body: "Not for new projects. zustand covers 90% of what I used Redux for.",
        parentCommentId: null,
        depth: 0,
        score: 4,
      },
      {
        postId: p4!.id,
        authorId: alice!.id,
        body: "The with: syntax for relations is so much nicer than manual joins. Great writeup.",
        parentCommentId: null,
        depth: 0,
        score: 7,
      },
      {
        postId: p5!.id,
        authorId: bob!.id,
        body: "Template literal types unlocked so much in my codebase. This is a great example.",
        parentCommentId: null,
        depth: 0,
        score: 6,
      },
    ])
    .returning();

  await db
    .insert(comments)
    .values([
      {
        postId: p1!.id,
        authorId: carol!.id,
        body: "Agreed. The compiler is exciting but I'd wait a few more minors before betting production on it.",
        parentCommentId: c1!.id,
        depth: 1,
        score: 5,
      },
      {
        postId: p1!.id,
        authorId: alice!.id,
        body: "Nice writeup, the stability notes were really helpful.",
        parentCommentId: c1!.id,
        depth: 2,
        score: 2,
      },
      {
        postId: p2!.id,
        authorId: carol!.id,
        body: "Also worth mentioning streaming and how it composes with server components.",
        parentCommentId: c3!.id,
        depth: 1,
        score: 3,
      },
      {
        postId: p3!.id,
        authorId: bob!.id,
        body: "We migrated a legacy app off Redux to React Query + zustand. Huge win.",
        parentCommentId: c4!.id,
        depth: 1,
        score: 4,
      },
      {
        postId: p4!.id,
        authorId: carol!.id,
        body: "Any tips on avoiding N+1 when you nest relations a few levels deep?",
        parentCommentId: c5!.id,
        depth: 1,
        score: 3,
      },
    ])
    .returning();

  await db.insert(votes).values([
    { userId: bob!.id, targetType: "post", targetId: p1!.id, value: 1 },
    { userId: carol!.id, targetType: "post", targetId: p1!.id, value: 1 },
    { userId: alice!.id, targetType: "post", targetId: p2!.id, value: 1 },
    { userId: carol!.id, targetType: "post", targetId: p4!.id, value: 1 },
    { userId: alice!.id, targetType: "post", targetId: p5!.id, value: -1 },
    { userId: alice!.id, targetType: "comment", targetId: c1!.id, value: 1 },
    { userId: carol!.id, targetType: "comment", targetId: c5!.id, value: 1 },
    { userId: bob!.id, targetType: "comment", targetId: c7!.id, value: 1 },
    { userId: alice!.id, targetType: "comment", targetId: c3!.id, value: 1 },
    { userId: carol!.id, targetType: "comment", targetId: c4!.id, value: -1 },
  ]);

  const usersCount = (await db.select().from(users)).length;
  const communitiesCount = (await db.select().from(communities)).length;
  const postsCount = (await db.select().from(posts)).length;
  const commentsCount = (await db.select().from(comments)).length;
  const votesCount = (await db.select().from(votes)).length;

  console.log(`Seeded:
  users: ${usersCount}
  communities: ${communitiesCount}
  posts: ${postsCount}
  comments: ${commentsCount}
  votes: ${votesCount}

Seed login (any user): password = ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
