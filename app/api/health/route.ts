import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    console.log('Health check - DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')

    const result = await query('SELECT NOW() as current_time')
    
    console.log('Database connection successful')
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      databaseTime: result.rows[0]?.current_time,
    })
  } catch (error) {
    console.error('Health check failed:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: errorMessage,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    }, { status: 500 })
  }
}
