import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "crsp_schedule"
      ADD COLUMN IF NOT EXISTS "engine_capacity_text" varchar,
      ADD COLUMN IF NOT EXISTS "source_group" varchar;

    UPDATE "crsp_schedule"
    SET "source_group" =
      CASE
        WHEN "category" = 'motorcycle' THEN 'motorcycle'
        WHEN "category" IN ('tractor', 'heavy-machinery') THEN 'tractor-grader'
        ELSE 'motor-vehicle'
      END
    WHERE "source_group" IS NULL;

    ALTER TABLE "crsp_schedule"
      ALTER COLUMN "source_group" SET NOT NULL;

    CREATE INDEX IF NOT EXISTS "crsp_schedule_source_group_idx"
      ON "crsp_schedule" ("source_group");

    CREATE INDEX IF NOT EXISTS "crsp_schedule_source_group_make_model_idx"
      ON "crsp_schedule" ("source_group", "make", "model");

    ALTER TABLE "crsp_schedule"
      DROP COLUMN IF EXISTS "category";

    ALTER TABLE "crsp_schedule"
      DROP COLUMN IF EXISTS "variant";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "crsp_schedule_source_group_make_model_idx";
    DROP INDEX IF EXISTS "crsp_schedule_source_group_idx";

    ALTER TABLE "crsp_schedule"
      ADD COLUMN IF NOT EXISTS "category" varchar;

    ALTER TABLE "crsp_schedule"
      ADD COLUMN IF NOT EXISTS "variant" varchar;

    UPDATE "crsp_schedule"
    SET "category" =
      CASE
        WHEN "source_group" = 'motorcycle' THEN 'motorcycle'
        WHEN "source_group" = 'tractor-grader' THEN 'tractor'
        ELSE 'car'
      END
    WHERE "category" IS NULL;

    ALTER TABLE "crsp_schedule"
      DROP COLUMN IF EXISTS "source_group";

    ALTER TABLE "crsp_schedule"
      DROP COLUMN IF EXISTS "engine_capacity_text";
  `)
}