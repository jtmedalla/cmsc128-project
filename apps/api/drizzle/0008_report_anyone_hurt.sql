CREATE TYPE "public"."anyone_hurt" AS ENUM('yes', 'no', 'unknown');--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "anyone_hurt" "anyone_hurt";