ALTER TABLE "devshub_post" ADD COLUMN "slug" varchar(350) NOT NULL;--> statement-breakpoint
CREATE INDEX "post_slug_idx" ON "devshub_post" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "devshub_post" ADD CONSTRAINT "devshub_post_slug_unique" UNIQUE("slug");