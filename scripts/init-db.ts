import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function initializeDatabase() {
  const client = await pool.connect()
  try {
    console.log('Creating lottery_entries table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS lottery_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number VARCHAR(4) NOT NULL UNIQUE,
        type VARCHAR(10) NOT NULL,
        date VARCHAR(50) NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    console.log('Creating indexes...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lottery_entries_type ON lottery_entries(type);
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lottery_entries_created_at ON lottery_entries(created_at DESC);
    `)

    console.log('✅ Database initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

initializeDatabase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
