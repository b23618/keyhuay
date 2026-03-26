import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function alterDatabase() {
  const client = await pool.connect()
  try {
    console.log('Altering lottery_entries table...')
    
    // Add primary_type column if it doesn't exist
    await client.query(`
      ALTER TABLE lottery_entries
      ADD COLUMN IF NOT EXISTS primary_type VARCHAR(50);
    `)
    console.log('✅ Added primary_type column')

    // Create index on primary_type if it doesn't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lottery_entries_primary_type ON lottery_entries(primary_type);
    `)
    console.log('✅ Created index on primary_type')

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
