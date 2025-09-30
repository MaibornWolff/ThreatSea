-- Update user roles in tables
CREATE TYPE "public"."user_role" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

ALTER TABLE "users_catalogs"
    ADD COLUMN "role_tmp" "public"."user_role";

UPDATE "users_catalogs"
SET "role_tmp" = CASE "role"
                     WHEN 0 THEN 'OWNER'::"public"."user_role"
                     WHEN 1 THEN 'EDITOR'::"public"."user_role"
                     ELSE 'VIEWER'::"public"."user_role"
    END;

ALTER TABLE "users_catalogs"
DROP COLUMN "role";

ALTER TABLE "users_catalogs"
    RENAME COLUMN "role_tmp" TO "role";


ALTER TABLE "users_projects"
    ADD COLUMN "role_tmp" "public"."user_role";

UPDATE "users_projects"
SET "role_tmp" = CASE "role"
                     WHEN 0 THEN 'OWNER'::"public"."user_role"
                     WHEN 1 THEN 'EDITOR'::"public"."user_role"
                     ELSE 'VIEWER'::"public"."user_role"
    END;

ALTER TABLE "users_projects"
DROP COLUMN "role";

ALTER TABLE "users_projects"
    RENAME COLUMN "role_tmp" TO "role";
