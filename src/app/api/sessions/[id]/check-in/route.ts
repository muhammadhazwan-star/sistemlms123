import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Staf check-in via QR token or 6-digit code (ATT-02, ATT-03)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const body = await req.json()
  const { qrToken, code6 } = body
  const c = await cookies()
  const userId = c.get('lms_session')?.value
  if (!userId) return NextResponse.json({ error: 'Tidak log masuk' }, { status: 401 })

  const session = await db.session.findUnique({ where: { id: sessionId } })
  if (!session) return NextResponse.json({ error: 'Sesi tidak dijumpai' }, { status: 404 })

  // Validate QR / code
  if (qrToken && qrToken !== session.qrToken) {
    return NextResponse.json({ error: 'Kod QR tidak sah' }, { status: 400 })
  }
  if (code6 && code6 !== session.code6) {
    return NextResponse.json({ error: 'Kod sesi tidak sah' }, { status: 400 })
  }
  if (!qrToken && !code6) {
    return NextResponse.json({ error: 'QR atau kod diperlukan' }, { status: 400 })
  }

  // Check code expiry for code-based check-in
  if (code6 && new Date() > session.codeExpiry) {
    return NextResponse.json({ error: 'Kod sesi telah tamat tempoh' }, { status: 400 })
  }

  // Existing attendance?
  const existing = await db.attendance.findFirst({ where: { sessionId, userId } })
  if (existing && existing.checkInAt) {
    return NextResponse.json({ error: 'Anda telah mendaftar masuk untuk sesi ini', attendance: existing }, { status: 400 })
  }

  // Determine late
  const now = new Date()
  const [sh, sm] = session.startTime.split(':').map(Number)
  const start = new Date(session.date)
  start.setHours(sh, sm, 0, 0)
  const diffMin = (now.getTime() - start.getTime()) / 60000
  const isLate = diffMin > session.lateAfterMin
  const method = qrToken ? 'QR' : 'CODE'

  let attendance
  if (existing) {
    attendance = await db.attendance.update({
      where: { id: existing.id },
      data: { status: isLate ? 'LEWAT' : 'HADIR', checkInAt: now, method }
    })
  } else {
    attendance = await db.attendance.create({
      data: {
        sessionId, userId,
        status: isLate ? 'LEWAT' : 'HADIR',
        checkInAt: now,
        method,
        recordedById: userId,
      }
    })
  }

  await db.auditLog.create({
    data: {
      userId, action: 'CHECK_IN', entity: 'attendance', entityId: attendance.id,
      after: `${method} - ${isLate ? 'LEWAT' : 'HADIR'}`,
    }
  })

  return NextResponse.json({ attendance, late: isLate })
}
