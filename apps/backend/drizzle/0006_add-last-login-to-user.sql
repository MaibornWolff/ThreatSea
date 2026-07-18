ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone DEFAULT now() NOT NULL;
