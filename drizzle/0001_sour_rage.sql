CREATE TABLE "trace_events" (
	"id" text PRIMARY KEY NOT NULL,
	"trace_id" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trace_events" ADD CONSTRAINT "trace_events_trace_id_traces_id_fk" FOREIGN KEY ("trace_id") REFERENCES "public"."traces"("id") ON DELETE cascade ON UPDATE no action;