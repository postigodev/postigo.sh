CREATE TABLE "portfolio_location" (
	"id" text PRIMARY KEY NOT NULL,
	"city" text NOT NULL,
	"region" text,
	"country" text NOT NULL,
	"timezone" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
