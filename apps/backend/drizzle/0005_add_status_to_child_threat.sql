CREATE TYPE "public"."child_threat_status" AS ENUM('new', 'in progress', 'finalized', 'out of scope');
ALTER TABLE "child_threats" RENAME COLUMN "doneEditing" TO "status";
ALTER TABLE "child_threats"
	ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "child_threats"
	ALTER COLUMN "status" TYPE "public"."child_threat_status"
	USING (
		CASE
			WHEN "status" = true THEN 'finalized'::"public"."child_threat_status"
			ELSE 'new'::"public"."child_threat_status"
		END
	);
ALTER TABLE "child_threats"
	ALTER COLUMN "status" SET DEFAULT 'new'::"public"."child_threat_status";