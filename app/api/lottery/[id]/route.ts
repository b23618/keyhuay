import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { number, type, date } = body

    if (!number || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For Yeekee, update date if provided; otherwise just update number and type
    let result
    if (type === 'yeekee' && date) {
      // Get current time
      const now = new Date()
      const timeStr = now.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      const fullDate = `${date} ${timeStr}`
      
      result = await query(
        'UPDATE lottery_entries SET number = $1, type = $2, date = $3, updated_at = NOW() WHERE id = $4 RETURNING id, number, type, digit_length as "digitLength", date, timestamp, created_at as "createdAt", updated_at as "updatedAt"',
        [number, type, fullDate, id]
      )
    } else {
      result = await query(
        'UPDATE lottery_entries SET number = $1, type = $2, updated_at = NOW() WHERE id = $3 RETURNING id, number, type, digit_length as "digitLength", date, timestamp, created_at as "createdAt", updated_at as "updatedAt"',
        [number, type, id]
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const result = await query(
      'DELETE FROM lottery_entries WHERE id = $1 RETURNING id, number, type, date, timestamp, created_at as "createdAt", updated_at as "updatedAt"',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
