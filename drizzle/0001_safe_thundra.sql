CREATE TABLE "devshub_comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"parentCommentId" uuid,
	"body" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"depth" smallint DEFAULT 0 NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devshub_community" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"iconObjectKey" text,
	"ownerId" uuid NOT NULL,
	"memberCount" integer DEFAULT 0 NOT NULL,
	"postCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devshub_community_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "devshub_community_member" (
	"communityId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"joinedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devshub_community_member_communityId_userId_pk" PRIMARY KEY("communityId","userId")
);
--> statement-breakpoint
CREATE TABLE "devshub_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"communityId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"title" varchar(300) NOT NULL,
	"body" text,
	"imageObjectKey" text,
	"score" integer DEFAULT 0 NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devshub_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"targetType" varchar(10) NOT NULL,
	"targetId" uuid NOT NULL,
	"value" smallint NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devshub_comment" ADD CONSTRAINT "devshub_comment_postId_devshub_post_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."devshub_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_comment" ADD CONSTRAINT "devshub_comment_authorId_devshub_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_comment" ADD CONSTRAINT "devshub_comment_parentCommentId_devshub_comment_id_fk" FOREIGN KEY ("parentCommentId") REFERENCES "public"."devshub_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_community" ADD CONSTRAINT "devshub_community_ownerId_devshub_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_community_member" ADD CONSTRAINT "devshub_community_member_communityId_devshub_community_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."devshub_community"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_community_member" ADD CONSTRAINT "devshub_community_member_userId_devshub_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_post" ADD CONSTRAINT "devshub_post_communityId_devshub_community_id_fk" FOREIGN KEY ("communityId") REFERENCES "public"."devshub_community"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_post" ADD CONSTRAINT "devshub_post_authorId_devshub_user_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_vote" ADD CONSTRAINT "devshub_vote_userId_devshub_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_post_created_idx" ON "devshub_comment" USING btree ("postId","createdAt");--> statement-breakpoint
CREATE INDEX "comment_author_id_idx" ON "devshub_comment" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "comment_parent_id_idx" ON "devshub_comment" USING btree ("parentCommentId");--> statement-breakpoint
CREATE INDEX "community_owner_id_idx" ON "devshub_community" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "community_created_at_idx" ON "devshub_community" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "community_member_user_id_idx" ON "devshub_community_member" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "community_member_community_id_idx" ON "devshub_community_member" USING btree ("communityId");--> statement-breakpoint
CREATE INDEX "post_community_created_idx" ON "devshub_post" USING btree ("communityId","createdAt");--> statement-breakpoint
CREATE INDEX "post_author_id_idx" ON "devshub_post" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "post_score_idx" ON "devshub_post" USING btree ("score");--> statement-breakpoint
CREATE INDEX "post_created_at_idx" ON "devshub_post" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "vote_user_target_unique" ON "devshub_vote" USING btree ("userId","targetType","targetId");--> statement-breakpoint
CREATE INDEX "vote_target_idx" ON "devshub_vote" USING btree ("targetId","targetType");