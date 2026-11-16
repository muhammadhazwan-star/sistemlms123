import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const logs = await db.auditLog.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
    include: { user: true },
  })
  return NextResponse.json({ logs })
}
