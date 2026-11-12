ALTER TABLE "blog" ADD COLUMN "author" varchar(150) NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "image_alt" text;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "meta_title" varchar(255);--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "meta_keywords" text[] DEFAULT '{}' NOT NULL;