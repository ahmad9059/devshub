CREATE TABLE "devshub_account" (
	"userId" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" text,
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "devshub_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "devshub_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"objectKey" text NOT NULL,
	"contentType" varchar(100) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devshub_image_objectKey_unique" UNIQUE("objectKey")
);
--> statement-breakpoint
CREATE TABLE "devshub_session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devshub_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"passwordHash" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devshub_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "devshub_verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "devshub_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "devshub_account" ADD CONSTRAINT "devshub_account_userId_devshub_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_session" ADD CONSTRAINT "devshub_session_userId_devshub_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "devshub_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "image_created_at_idx" ON "devshub_image" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "devshub_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "devshub_user" USING btree ("email");