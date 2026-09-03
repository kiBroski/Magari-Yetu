import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

// Dealer verification evidence was previously linked to public Media. There
// are no live records to copy, so move the foreign key directly to the
// private verification-documents collection.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "dealers_verification_docs"
      DROP CONSTRAINT IF EXISTS "dealers_verification_docs_file_id_media_id_fk";
    DO $$ BEGIN
      ALTER TABLE "dealers_verification_docs"
        ADD CONSTRAINT "dealers_verification_docs_file_id_verification_documents_id_fk"
        FOREIGN KEY ("file_id") REFERENCES "public"."verification_documents"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "dealers_verification_docs"
      DROP CONSTRAINT IF EXISTS "dealers_verification_docs_file_id_verification_documents_id_fk";
    ALTER TABLE "dealers_verification_docs"
      ADD CONSTRAINT "dealers_verification_docs_file_id_media_id_fk"
      FOREIGN KEY ("file_id") REFERENCES "public"."media"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  `)
}
