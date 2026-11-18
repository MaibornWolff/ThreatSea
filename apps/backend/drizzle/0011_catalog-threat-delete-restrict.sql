ALTER TABLE "generic_threats" DROP CONSTRAINT "generic_threats_catalogThreatId_catalog_threats_id_fk";

ALTER TABLE "generic_threats" ADD CONSTRAINT "generic_threats_catalogThreatId_catalog_threats_id_fk" FOREIGN KEY ("catalogThreatId") REFERENCES "public"."catalog_threats"("id") ON DELETE restrict ON UPDATE cascade;