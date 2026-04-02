import { query, closePool } from '../lib/db'

async function createPresetGroupsTable() {
  try {
    console.log('Creating preset_groups table...')
    
    await query(`
      CREATE TABLE IF NOT EXISTS preset_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        numbers TEXT[] NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)
    console.log('✅ Created preset_groups table')

    await query(`
      CREATE INDEX IF NOT EXISTS idx_preset_groups_created_at 
      ON preset_groups(created_at);
    `)
    console.log('✅ Created index on created_at')

    console.log('✅ Database migration completed successfully!')
  } catch (error) {
    console.error('❌ Error creating preset_groups table:', error)
    throw error
  } finally {
    await closePool()
  }
}

createPresetGroupsTable().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
