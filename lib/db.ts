import { Pool, QueryResult, QueryResultRow } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err)
})

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: result.rowCount })
    return result
  } catch (error) {
    console.error('Database query error', { text, error })
    throw error
  }
}

export async function getClient() {
  return pool.connect()
}

export async function closePool() {
  await pool.end()
}

export default pool
