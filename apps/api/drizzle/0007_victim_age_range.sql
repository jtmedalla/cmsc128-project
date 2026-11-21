ALTER TABLE "victim" DROP CONSTRAINT "victim_age_check";--> statement-breakpoint
ALTER TABLE "victim" ADD COLUMN "age_min" integer;--> statement-breakpoint
ALTER TABLE "victim" ADD COLUMN "age_max" integer;--> statement-breakpoint
ALTER TABLE "victim" DROP COLUMN "age";--> statement-breakpoint
ALTER TABLE "victim" ADD CONSTRAINT "victim_age_min_check" CHECK ("victim"."age_min" >= 0);--> statement-breakpoint
ALTER TABLE "victim" ADD CONSTRAINT "victim_age_range_check" CHECK ("victim"."age_max" >= coalesce("victim"."age_min", 0));