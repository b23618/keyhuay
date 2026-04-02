import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const offset = (page - 1) * limit

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM lottery_entries')
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results
    const result = await query(
      'SELECT id, number, type, digit_length as "digitLength", date, timestamp, created_at as "createdAt", updated_at as "updatedAt" FROM lottery_entries ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )

    return NextResponse.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { number, type, digitLength, date, timestamp } = body

    console.log('POST /api/lottery - Received:', { number, type, digitLength, date, timestamp })

    if (!number || !type || !date) {
      console.warn('Missing required fields:', { number, type, date })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Inserting new entry:', { number, type, digitLength, date, timestamp })
    const result = await query(
      'INSERT INTO lottery_entries (number, type, digit_length, date, timestamp) VALUES ($1, $2, $3, $4, $5) RETURNING id, number, type, digit_length as "digitLength", date, timestamp, created_at as "createdAt", updated_at as "updatedAt"',
      [number, type, digitLength || 4, date, timestamp || Date.now()]
    )

    console.log('Entry created successfully:', result.rows[0])
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating entry:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Failed to create entry', details: errorMessage }, { status: 500 })
  }
}
