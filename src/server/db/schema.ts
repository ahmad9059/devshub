import { index, pgTableCreator } from "drizzle-orm/pg-core";

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
