// Temporary-compatible migration runner for environments where the Payload
// CLI cannot start. The canonical migration remains in src/migrations/.
require('dotenv/config')

const { Pool } = require('pg')

const statements = [
  'ALTER TABLE crsp_schedule ADD COLUMN IF NOT EXISTS model_number varchar, ADD COLUMN IF NOT EXISTS transmission varchar, ADD COLUMN IF NOT EXISTS drive_configuration varchar, ADD COLUMN IF NOT EXISTS body_type varchar, ADD COLUMN IF NOT EXISTS gvw_kg numeric, ADD COLUMN IF NOT EXISTS seating_capacity numeric',
  'ALTER TABLE listings ADD COLUMN IF NOT EXISTS model_number varchar, ADD COLUMN IF NOT EXISTS drive_configuration varchar, ADD COLUMN IF NOT EXISTS gross_vehicle_weight_kg numeric, ADD COLUMN IF NOT EXISTS seating_capacity numeric, ADD COLUMN IF NOT EXISTS crsp_record_id integer, ADD COLUMN IF NOT EXISTS crsp_value_kes numeric',
  'DO $$ BEGIN ALTER TABLE listings ADD CONSTRAINT listings_crsp_record_id_crsp_schedule_id_fk FOREIGN KEY (crsp_record_id) REFERENCES crsp_schedule(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$',
  'CREATE INDEX IF NOT EXISTS crsp_schedule_make_model_idx ON crsp_schedule (make, model)',
  'CREATE INDEX IF NOT EXISTS listings_crsp_record_id_idx ON listings (crsp_record_id)',
  'CREATE INDEX IF NOT EXISTS listings_crsp_value_kes_idx ON listings (crsp_value_kes)',
  'ALTER TABLE dealers_verification_docs DROP CONSTRAINT IF EXISTS dealers_verification_docs_file_id_media_id_fk',
  'DO $$ BEGIN ALTER TABLE dealers_verification_docs ADD CONSTRAINT dealers_verification_docs_file_id_verification_documents_id_fk FOREIGN KEY (file_id) REFERENCES verification_documents(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$',
]

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URI })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    for (const statement of statements) await client.query(statement)
    await client.query('COMMIT')
    console.log('Applied listing, CRSP, and private-KYC schema migrations.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
