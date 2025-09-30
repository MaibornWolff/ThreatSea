CREATE TYPE "public"."language" AS ENUM('EN', 'DE');
UPDATE catalogs
SET language = 'EN'
WHERE LOWER(language) = 'en';
UPDATE catalogs
SET language = 'DE'
WHERE LOWER(language) = 'de';
ALTER TABLE "catalogs"
    ALTER COLUMN "language" SET DATA TYPE "public"."language" USING "language"::"public"."language";

UPDATE "catalog_measures"
SET "description" = ''
WHERE "description" IS NULL;
ALTER TABLE "catalog_measures"
    ALTER COLUMN "description" SET NOT NULL;

UPDATE "catalog_threats"
SET "description" = ''
WHERE "description" IS NULL;
ALTER TABLE "catalog_threats"
    ALTER COLUMN "description" SET NOT NULL;

UPDATE "measure_impacts"
SET "description" = ''
WHERE "description" IS NULL;
ALTER TABLE "measure_impacts"
    ALTER COLUMN "description" SET NOT NULL;

UPDATE "measures"
SET "description" = ''
WHERE "description" IS NULL;
ALTER TABLE "measures"
    ALTER COLUMN "description" SET NOT NULL;

UPDATE "projects"
SET "description" = ''
WHERE "description" IS NULL;
ALTER TABLE "projects"
    ALTER COLUMN "description" SET NOT NULL;

UPDATE "threats"
SET "description" = ''
WHERE "description" IS NULL;
ALTER TABLE "threats"
    ALTER COLUMN "description" SET NOT NULL;

ALTER TABLE "component_types"
    ALTER COLUMN "projectId" SET NOT NULL;

ALTER TABLE "projects"
    ALTER COLUMN "lineOfToleranceGreen" SET NOT NULL;
ALTER TABLE "projects"
    ALTER COLUMN "lineOfToleranceRed" SET NOT NULL;

ALTER TABLE "catalog_threats" DROP COLUMN "isDefault";
