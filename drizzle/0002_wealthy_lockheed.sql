ALTER TABLE "portfolio_location" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "portfolio_location" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "portfolio_location" ADD COLUMN "weather_symbol_code" text;--> statement-breakpoint
ALTER TABLE "portfolio_location" ADD COLUMN "weather_temperature_c" double precision;--> statement-breakpoint
ALTER TABLE "portfolio_location" ADD COLUMN "weather_observed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "portfolio_location" ADD COLUMN "weather_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "portfolio_location" ADD COLUMN "weather_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "portfolio_location" ADD COLUMN "weather_last_modified" text;