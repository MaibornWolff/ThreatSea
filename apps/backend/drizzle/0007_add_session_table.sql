CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" json NOT NULL,
	"expire" timestamp (6) NOT NULL
);

CREATE INDEX "IDX_session_expire" ON "session" USING btree ("expire");