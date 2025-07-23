CREATE TABLE "flow_execution" (
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"flow_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input" jsonb,
	"metadata" jsonb,
	"result" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flow" (
	"created_at" timestamp DEFAULT now(),
	"crew_id" uuid NOT NULL,
	"description" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"is_active" boolean DEFAULT true,
	"name" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_connection" (
	"created_at" timestamp DEFAULT now(),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_output_id" uuid NOT NULL,
	"source_task_id" uuid NOT NULL,
	"target_input_id" uuid NOT NULL,
	"target_task_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_execution" (
	"completed_at" timestamp,
	"cost" integer,
	"created_at" timestamp DEFAULT now(),
	"duration" integer,
	"error" text,
	"flow_execution_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input" jsonb,
	"metadata" jsonb,
	"output" jsonb,
	"started_at" timestamp DEFAULT now(),
	"status" text DEFAULT 'pending' NOT NULL,
	"task_id" uuid NOT NULL,
	"tokens_used" integer
);
--> statement-breakpoint
CREATE TABLE "task_input" (
	"created_at" timestamp DEFAULT now(),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input_type" text NOT NULL,
	"name" text NOT NULL,
	"required" boolean DEFAULT false,
	"task_id" uuid NOT NULL,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "task_output" (
	"created_at" timestamp DEFAULT now(),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"output_type" text NOT NULL,
	"task_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"config" jsonb,
	"created_at" timestamp DEFAULT now(),
	"description" text,
	"flow_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL,
	"task_type" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "agent_execution" CASCADE;--> statement-breakpoint
DROP TABLE "execution_step" CASCADE;--> statement-breakpoint
DROP TABLE "workflow_execution" CASCADE;--> statement-breakpoint
ALTER TABLE "flow_execution" ADD CONSTRAINT "flow_execution_flow_id_flow_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flow"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_execution" ADD CONSTRAINT "flow_execution_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow" ADD CONSTRAINT "flow_crew_id_crew_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crew"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_connection" ADD CONSTRAINT "task_connection_source_output_id_task_output_id_fk" FOREIGN KEY ("source_output_id") REFERENCES "public"."task_output"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_connection" ADD CONSTRAINT "task_connection_source_task_id_task_id_fk" FOREIGN KEY ("source_task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_connection" ADD CONSTRAINT "task_connection_target_input_id_task_input_id_fk" FOREIGN KEY ("target_input_id") REFERENCES "public"."task_input"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_connection" ADD CONSTRAINT "task_connection_target_task_id_task_id_fk" FOREIGN KEY ("target_task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_flow_execution_id_flow_execution_id_fk" FOREIGN KEY ("flow_execution_id") REFERENCES "public"."flow_execution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_execution" ADD CONSTRAINT "task_execution_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_input" ADD CONSTRAINT "task_input_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_output" ADD CONSTRAINT "task_output_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_flow_id_flow_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."flow"("id") ON DELETE cascade ON UPDATE no action;