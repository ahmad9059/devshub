ALTER TABLE "devshub_user" ADD COLUMN "username" varchar(20);--> statement-breakpoint
ALTER TABLE "devshub_user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "devshub_user" ADD COLUMN "avatarObjectKey" text;--> statement-breakpoint
CREATE INDEX "user_username_idx" ON "devshub_user" USING btree ("username");--> statement-breakpoint
ALTER TABLE "devshub_user" ADD CONSTRAINT "devshub_user_username_unique" UNIQUE("username");