import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// List attendance corrections (ATT-09 / HR view)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state') || 'PENDING'

  const corrections = await db.attendanceCorrection.findMany({
    where: state === 'all' ? {} : { state: state as any },
    include: {
      attendance: { include: { session: { include: { course: true } }, user: { include: { department: true } } } },
      requester: true,
      approver: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ corrections })
}
