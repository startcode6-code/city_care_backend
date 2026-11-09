CREATE TABLE "service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" varchar(150) NOT NULL,
	"service_name" varchar(150) NOT NULL,
	"summary" varchar NOT NULL,
	"photo_url" text,
	"photo_public_id" text,
	"service" text[] NOT NULL,
	CONSTRAINT "service_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_user_id_admins_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;