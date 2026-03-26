import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT id, number, type, primary_type as "primaryType", date, timestamp, created_at as "createdAt", updated_at as "updatedAt" FROM lottery_entries ORDER BY created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { number, type, primaryType, date, timestamp } = body

    console.log('POST /api/lottery - Received:', { number, type, primaryType, date, timestamp })

    if (!number || !type || !date) {
      console.warn('Missing required fields:', { number, type, date })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Checking for duplicate number:', number)
    const existingResult = await query(
      'SELECT id FROM lottery_entries WHERE number = $1',
      [number]
    )

    if (existingResult.rows.length > 0) {
      console.warn('Duplicate number found:', number)
      return NextResponse.json({ error: 'Duplicate number' }, { status: 409 })
    }

    console.log('Inserting new entry:', { number, type, primaryType, date, timestamp })
    const result = await query(
      'INSERT INTO lottery_entries (number, type, primary_type, date, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING id, number, type, primary_type as "primaryType", date, timestamp, created_at as "createdAt", updated_at as "updatedAt"',
      [number, type, primaryType || null, date, timestamp || Date.now()]
    )

    console.log('Entry created successfully:', result.rows[0])
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to create entry', details: errorMessage }, { status: 500 })
  }
}
