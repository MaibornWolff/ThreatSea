CREATE TYPE "public"."child_threat_status" AS ENUM('new', 'in progress', 'finalized', 'out of scope');
ALTER TABLE "child_threats" RENAME COLUMN "doneEditing" TO "status";