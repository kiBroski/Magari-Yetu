import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Adds structured vehicle specifications without rewriting existing listings.
// All columns are nullable so current listings remain valid, while new and
// edited listings can retain the complete CRSP/source specification.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "crsp_schedule"
      ADD COLUMN IF NOT EXISTS "model_number" varchar,
      ADD COLUMN IF NOT EXISTS "transmission" varchar,
      ADD COLUMN IF NOT EXISTS "drive_configuration" varchar,
      ADD COLUMN IF NOT EXISTS "engine_cc" numeric,
      ADD COLUMN IF NOT EXISTS "fuel_type" varchar,
      ADD COLUMN IF NOT EXISTS "body_type" varchar,
      ADD COLUMN IF NOT EXISTS "gvw_kg" numeric,
      ADD COLUMN IF NOT EXISTS "seating_capacity" numeric;

    ALTER TABLE "listings"
      ADD COLUMN IF NOT EXISTS "model_number" varchar,
      ADD COLUMN IF NOT EXISTS "drive_configuration" varchar,
      ADD COLUMN IF NOT EXISTS "gross_vehicle_weight_kg" numeric,
      ADD COLUMN IF NOT EXISTS "seating_capacity" numeric,
      ADD COLUMN IF NOT EXISTS "crsp_record_id" integer,
      ADD COLUMN IF NOT EXISTS "crsp_value_kes" numeric;

    DO $$ BEGIN
      ALTER TABLE "listings"
        ADD CONSTRAINT "listings_crsp_record_id_crsp_schedule_id_fk"
        FOREIGN KEY ("crsp_record_id")
        REFERENCES "public"."crsp_schedule"("id")
        ON DELETE SET NULL
        ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "crsp_schedule_make_model_idx"
      ON "crsp_schedule" USING btree ("make", "model");

    CREATE INDEX IF NOT EXISTS "listings_crsp_record_id_idx"
      ON "listings" USING btree ("crsp_record_id");

    CREATE INDEX IF NOT EXISTS "listings_crsp_value_kes_idx"
      ON "listings" USING btree ("crsp_value_kes");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "listings_crsp_value_kes_idx";

    DROP INDEX IF EXISTS "listings_crsp_record_id_idx";

    DROP INDEX IF EXISTS "crsp_schedule_make_model_idx";

    ALTER TABLE "listings"
      DROP CONSTRAINT IF EXISTS "listings_crsp_record_id_crsp_schedule_id_fk";

    ALTER TABLE "listings"
      DROP COLUMN IF EXISTS "crsp_value_kes",
      DROP COLUMN IF EXISTS "crsp_record_id",
      DROP COLUMN IF EXISTS "seating_capacity",
      DROP COLUMN IF EXISTS "gross_vehicle_weight_kg",
      DROP COLUMN IF EXISTS "drive_configuration",
      DROP COLUMN IF EXISTS "model_number";

    ALTER TABLE "crsp_schedule"
      DROP COLUMN IF EXISTS "seating_capacity",
      DROP COLUMN IF EXISTS "gvw_kg",
      DROP COLUMN IF EXISTS "body_type",
      DROP COLUMN IF EXISTS "fuel_type",
      DROP COLUMN IF EXISTS "engine_cc",
      DROP COLUMN IF EXISTS "drive_configuration",
      DROP COLUMN IF EXISTS "transmission",
      DROP COLUMN IF EXISTS "model_number";
  `)
}