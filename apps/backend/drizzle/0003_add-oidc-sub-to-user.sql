ALTER TABLE "tokens" ALTER COLUMN "token" SET DATA TYPE text;
ALTER TABLE "users" ADD COLUMN "oidc_sub" varchar(255);
CREATE UNIQUE INDEX "users_oidc_sub" ON "users" USING btree ("oidc_sub");