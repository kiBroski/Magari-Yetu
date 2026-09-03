require('dotenv/config')

const { Pool } = require('pg')

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URI })
  try {
    const [counts, sizes, indexes, columns] = await Promise.all([
      pool.query(`
        SELECT 'listings' AS table_name, COUNT(*)::int AS row_count FROM listings
        UNION ALL SELECT 'listings_images', COUNT(*)::int FROM listings_images
        UNION ALL SELECT 'media', COUNT(*)::int FROM media
        UNION ALL SELECT 'verification_documents', COUNT(*)::int FROM verification_documents
        UNION ALL SELECT 'crsp_schedule', COUNT(*)::int FROM crsp_schedule
        ORDER BY table_name
      `),
      pool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS database_size
      `),
      pool.query(`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('listings', 'crsp_schedule', 'listings_images', 'media', 'verification_documents')
        ORDER BY tablename, indexname
      `),
      pool.query(`
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN ('listings', 'crsp_schedule', 'verification_documents')
        ORDER BY table_name, ordinal_position
      `),
    ])

    console.log(JSON.stringify({
      databaseSize: sizes.rows[0].database_size,
      rowCounts: counts.rows,
      indexes: indexes.rows,
      columns: columns.rows,
    }, null, 2))
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
