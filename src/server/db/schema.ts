import {
  foreignKey,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `devshub_${name}`);

export const images = createTable(
  "image",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    objectKey: d.text().notNull().unique(),
    contentType: d.varchar({ length: 100 }).notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [index("image_created_at_idx").on(table.createdAt)],
);

export const users = createTable(
  "user",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    name: d.varchar({ length: 255 }),
    email: d.varchar({ length: 255 }).notNull().unique(),
    emailVerified: timestamp({ withTimezone: true, mode: "date" }),
    image: d.text(),
    passwordHash: d.text(),
    username: d.varchar({ length: 20 }).unique(),
    usernameUpdatedAt: d.timestamp({ withTimezone: true }),
    bio: d.text(),
    avatarObjectKey: d.text(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_username_idx").on(table.username),
  ],
);

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar({ length: 255 }).$type<string>().notNull(),
    provider: varchar({ length: 255 }).notNull(),
    providerAccountId: varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: integer(),
    token_type: varchar({ length: 255 }),
    scope: d.text(),
    id_token: d.text(),
    session_state: varchar({ length: 255 }),
  }),
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.text().primaryKey(),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp({ withTimezone: true, mode: "date" }).notNull(),
  }),
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.text().notNull(),
    token: d.text().notNull(),
    expires: timestamp({ withTimezone: true, mode: "date" }).notNull(),
  }),
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export type User = typeof users.$inferSelect;

export const communityMembersRole = ["member", "moderator", "owner"] as const;
export type CommunityMemberRole = (typeof communityMembersRole)[number];

export const voteTargetTypes = ["post", "comment"] as const;
export type VoteTargetType = (typeof voteTargetTypes)[number];

export const communities = createTable(
  "community",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    slug: d.varchar({ length: 50 }).notNull().unique(),
    name: d.varchar({ length: 100 }).notNull(),
    description: d.text(),
    iconObjectKey: d.text(),
    ownerId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    memberCount: d.integer().notNull().default(0),
    postCount: d.integer().notNull().default(0),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    index("community_owner_id_idx").on(table.ownerId),
    index("community_created_at_idx").on(table.createdAt),
  ],
);

export const communityMembers = createTable(
  "community_member",
  (d) => ({
    communityId: d
      .uuid()
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: d
      .varchar({ length: 20 })
      .$type<CommunityMemberRole>()
      .notNull()
      .default("member"),
    joinedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    primaryKey({ columns: [table.communityId, table.userId] }),
    index("community_member_user_id_idx").on(table.userId),
    index("community_member_community_id_idx").on(table.communityId),
  ],
);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    communityId: d
      .uuid()
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    authorId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 300 }).notNull(),
    slug: d.varchar({ length: 350 }).notNull().unique(),
    body: d.text(),
    imageObjectKey: d.text(),
    score: d.integer().notNull().default(0),
    commentCount: d.integer().notNull().default(0),
    deletedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    index("post_community_created_idx").on(table.communityId, table.createdAt),
    index("post_author_id_idx").on(table.authorId),
    index("post_score_idx").on(table.score),
    index("post_created_at_idx").on(table.createdAt),
    index("post_slug_idx").on(table.slug),
  ],
);

export const comments = createTable(
  "comment",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    postId: d
      .uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentCommentId: d.uuid(),
    body: d.text().notNull(),
    score: d.integer().notNull().default(0),
    depth: d.smallint().notNull().default(0),
    deletedAt: d.timestamp({ withTimezone: true }),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    index("comment_post_created_idx").on(table.postId, table.createdAt),
    index("comment_author_id_idx").on(table.authorId),
    index("comment_parent_id_idx").on(table.parentCommentId),
    foreignKey({
      columns: [table.parentCommentId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
  ],
);

export const votes = createTable(
  "vote",
  (d) => ({
    id: d.uuid().defaultRandom().primaryKey(),
    userId: d
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: d.varchar({ length: 10 }).$type<VoteTargetType>().notNull(),
    targetId: d.uuid().notNull(),
    value: d.smallint().notNull(),
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [
    uniqueIndex("vote_user_target_unique").on(
      table.userId,
      table.targetType,
      table.targetId,
    ),
    index("vote_target_idx").on(table.targetId, table.targetType),
  ],
);

export type Community = typeof communities.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Vote = typeof votes.$inferSelect;
