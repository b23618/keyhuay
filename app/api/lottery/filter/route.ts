import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'thai' | 'hanoi' | 'yeekee'
    const digitLength = searchParams.get('digitLength') // '3' | '4'
    const days = searchParams.get('days') // '1' | '3' | '7'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    // Validate parameters
    if (!type || !digitLength || !days) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, digitLength, days' },
        { status: 400 }
      )
    }

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days))
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

    // Get total count - use created_at instead of date field since it's in proper format
    const countResult = await query(
      `SELECT COUNT(*) FROM lottery_entries 
       WHERE type = $1 AND digit_length = $2 AND DATE(created_at) >= $3`,
      [type, parseInt(digitLength), cutoffDateStr]
    )
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results - use created_at instead of date field
    const result = await query(
      `SELECT id, number, type, digit_length as "digitLength", date, timestamp, created_at as "createdAt", updated_at as "updatedAt" 
       FROM lottery_entries 
       WHERE type = $1 AND digit_length = $2 AND DATE(created_at) >= $3
       ORDER BY created_at DESC 
       LIMIT $4 OFFSET $5`,
      [type, parseInt(digitLength), cutoffDateStr, limit, offset]
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
    console.error('Error filtering entries:', error)
    return NextResponse.json(
      { error: 'Failed to filter entries' },
      { status: 500 }
    )
  }
}
