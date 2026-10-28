CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" varchar(150) NOT NULL,
	"name" varchar(150) NOT NULL,
	"department" varchar(100) NOT NULL,
	"role" varchar(150) NOT NULL,
	"years" integer NOT NULL,
	"days" text NOT NULL,
	"languages" text NOT NULL,
	"bio" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_admins_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "doctors_slug_unique" ON "doctors" USING btree ("slug");