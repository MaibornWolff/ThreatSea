CREATE TYPE "public"."standard_icon" AS ENUM('USERS', 'CLIENT', 'SERVER', 'DATABASE');
ALTER TABLE "component_types" ADD COLUMN "standardIcon" "standard_icon";
ALTER TABLE "component_types" ADD CONSTRAINT "component_types_icon_not_both_set" CHECK (not ("component_types"."symbol" is not null and "component_types"."standardIcon" is not null));