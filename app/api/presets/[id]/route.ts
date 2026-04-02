import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const result = await query(
      'DELETE FROM preset_groups WHERE id = $1 RETURNING id, name',
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Preset group not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Error deleting preset group:', error)
    return NextResponse.json({ error: 'Failed to delete preset group' }, { status: 500 })
  }
}
