import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId')
  const userId = searchParams.get('userId')

  const where: any = {}
  if (sessionId) where.sessionId = sessionId
  if (userId) where.userId = userId

  const attendances = await db.attendance.findMany({
    where,
    include: {
      user: { include: { department: true } },
      session: { include: { course: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ attendances })
}
