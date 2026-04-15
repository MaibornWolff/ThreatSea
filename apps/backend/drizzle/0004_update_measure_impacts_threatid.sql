ALTER TABLE "measure_impacts" DROP CONSTRAINT "measure_impacts_threatId_threats_id_fk";
ALTER TABLE "measure_impacts" DROP CONSTRAINT "measure_impacts_measure_id_threat_id_unique";
DROP INDEX IF EXISTS "measure_impacts_measure_id_threat_id";

ALTER TABLE "measure_impacts" RENAME COLUMN "threatId" TO "childThreatId";

ALTER TABLE "measure_impacts"
    ADD CONSTRAINT "measure_impacts_childThreatId_child_threats_id_fk"
    FOREIGN KEY ("childThreatId") REFERENCES "public"."child_threats"("id") ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "measure_impacts"
    ADD CONSTRAINT "measure_impacts_measure_id_child_threat_id_unique"
    UNIQUE("measureId", "childThreatId");

CREATE INDEX "measure_impacts_measure_id_child_threat_id" ON "measure_impacts" USING btree ("measureId", "childThreatId");
CREATE INDEX "measure_impacts_child_threat_id" ON "measure_impacts" USING btree ("childThreatId");
CREATE INDEX "measure_impacts_measure_id" ON "measure_impacts" USING btree ("measureId");