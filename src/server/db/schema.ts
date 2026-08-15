import {
  index,
  integer,
  pgTableCreator,
  primaryKey,
  smallint,
  text,
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
    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  }),
  (table) => [index("user_email_idx").on(table.email)],
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
