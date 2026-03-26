import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function alterDatabase() {
  const client = await pool.connect()
  try {
    console.log('Altering lottery_entries table...')
    
    // Drop primary_type column if it exists
    await client.query(`
      ALTER TABLE lottery_entries
      DROP COLUMN IF EXISTS primary_type;
    `)
    console.log('✅ Dropped primary_type column')

    // Add digit_length column if it doesn't exist
    await client.query(`
      ALTER TABLE lottery_entries
      ADD COLUMN IF NOT EXISTS digit_length INTEGER NOT NULL DEFAULT 4;
    `)
    console.log('✅ Added digit_length column')

    // Drop old index if it exists
    await client.query(`
      DROP INDEX IF EXISTS idx_lottery_entries_primary_type;
    `)
    console.log('✅ Dropped old primary_type index')

    // Create index on digit_length if it doesn't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lottery_entries_digit_length ON lottery_entries(digit_length);
    `)
    console.log('✅ Created index on digit_length')

    // Drop UNIQUE constraint on number column if it exists
    await client.query(`
      ALTER TABLE lottery_entries
      DROP CONSTRAINT IF EXISTS lottery_entries_number_key;
    `)
    console.log('✅ Dropped UNIQUE constraint on number column')

    console.log('✅ Database altered successfully!')
  } catch (error) {
    console.error('❌ Error altering database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

alterDatabase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
