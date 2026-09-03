require('dotenv/config')

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
})

pool
  .query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'crsp_schedule'
    ORDER BY ordinal_position
  `)
  .then((result) => {
    console.table(result.rows)
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    pool.end()
  })