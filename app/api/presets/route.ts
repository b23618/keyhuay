import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, numbers, created_at as "createdAt", updated_at as "updatedAt" FROM preset_groups ORDER BY created_at DESC'
    )

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    console.error('Error fetching preset groups:', error)
    return NextResponse.json({ error: 'Failed to fetch preset groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, numbers } = body

    if (!name || !numbers || !Array.isArray(numbers)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await query(
      'INSERT INTO preset_groups (name, numbers) VALUES ($1, $2) RETURNING id, name, numbers, created_at as "createdAt", updated_at as "updatedAt"',
      [name, numbers]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Error creating preset group:', error)
    return NextResponse.json({ error: 'Failed to create preset group' }, { status: 500 })
  }
}
