CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(30) NOT NULL,
	"name" varchar(150) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"department" varchar(150) NOT NULL,
	"doctor" varchar(150),
	"package" varchar(150),
	"date" date NOT NULL,
	"time" varchar(50) NOT NULL,
	"reason" text,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE INDEX "appointment_phone_idx" ON "appointment" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "appointment_date_idx" ON "appointment" USING btree ("date");--> statement-breakpoint
CREATE INDEX "appointment_status_idx" ON "appointment" USING btree ("status");