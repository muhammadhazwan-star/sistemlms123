import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Request correction (ATT-09)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: attendanceId } = await params
  const body = await req.json()
  const c = await cookies()
  const userId = c.get('lms_session')?.value
  if (!userId) return NextResponse.json({ error: 'Tidak log masuk' }, { status: 401 })

  const attendance = await db.attendance.findUnique({ where: { id: attendanceId } })
  if (!attendance) return NextResponse.json({ error: 'Rekod tidak dijumpai' }, { status: 404 })

  const correction = await db.attendanceCorrection.create({
    data: {
      attendanceId,
      requestedById: userId,
      oldStatus: attendance.status,
      newStatus: body.newStatus,
      reason: body.reason,
      state: 'PENDING',
    }
  })
  return NextResponse.json({ correction })
}

// Approve/reject (HR only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: attendanceId } = await params
  const body = await req.json()
  const c = await cookies()
  const approverId = c.get('lms_session')?.value

  // find latest pending correction
  const correction = await db.attendanceCorrection.findFirst({
    where: { attendanceId, state: 'PENDING' },
    orderBy: { createdAt: 'desc' }
  })
  if (!correction) return NextResponse.json({ error: 'Tiada pembetulan menunggu' }, { status: 404 })

  const updated = await db.attendanceCorrection.update({
    where: { id: correction.id },
    data: {
      state: body.state, // APPROVED or REJECTED
      approvedById: approverId,
    }
  })

  if (body.state === 'APPROVED') {
    const att = await db.attendance.findUnique({ where: { id: attendanceId } })
    if (att) {
      await db.attendance.update({ where: { id: attendanceId }, data: { status: correction.newStatus } })
      await db.auditLog.create({
        data: {
          userId: approverId, action: 'CORRECTION_APPROVED', entity: 'attendance', entityId: attendanceId,
          before: JSON.stringify({ status: att.status }), after: JSON.stringify({ status: correction.newStatus })
        }
      })
    }
  }
  return NextResponse.json({ correction: updated })
}
