CREATE TABLE "devshub_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" uuid NOT NULL,
	"targetType" varchar(10) NOT NULL,
	"targetId" uuid NOT NULL,
	"reason" varchar(20) NOT NULL,
	"details" text,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolvedBy" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "devshub_report" ADD CONSTRAINT "devshub_report_reporterId_devshub_user_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."devshub_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devshub_report" ADD CONSTRAINT "devshub_report_resolvedBy_devshub_user_id_fk" FOREIGN KEY ("resolvedBy") REFERENCES "public"."devshub_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_target_idx" ON "devshub_report" USING btree ("targetType","targetId");--> statement-breakpoint
CREATE INDEX "report_status_idx" ON "devshub_report" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_created_at_idx" ON "devshub_report" USING btree ("createdAt");