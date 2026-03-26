import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

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
