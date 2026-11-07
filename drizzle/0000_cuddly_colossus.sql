CREATE TABLE "traces" (
	"id" text PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"status" integer,
	"duration_ms" integer,
	"created_at" text NOT NULL
);
