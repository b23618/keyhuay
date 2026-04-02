import { query, closePool } from '../lib/db'

async function addRoundColumn() {
  try {
    console.log('Adding round column to lottery_entries table...')
    
    // Add round column if it doesn't exist
    await query(`
      ALTER TABLE lottery_entries
      ADD COLUMN IF NOT EXISTS round INTEGER;
    `)
    console.log('✅ Added round column')

    // Create index on round for faster filtering
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lottery_entries_round ON lottery_entries(round);
    `)
    console.log('✅ Created index on round column')

    // Create composite index for type and round (useful for Yeekee filtering)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_lottery_entries_type_round ON lottery_entries(type, round);
    `)
    console.log('✅ Created composite index on type and round')

    console.log('✅ Database migration completed successfully!')
  } catch (error) {
    console.error('❌ Error adding round column:', error)
    throw error
  } finally {
    await closePool()
  }
}

addRoundColumn().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
