import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Bulk manual entry (ATT-05). Body: { records: [{ userId, status, remarks }] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const body = await req.json()
  const { records } = body
  const c = await cookies()
  const recorderId = c.get('lms_session')?.value

  const session = await db.session.findUnique({ where: { id: sessionId } })
  if (!session) return NextResponse.json({ error: 'Sesi tidak dijumpai' }, { status: 404 })

  const [sh, sm] = session.startTime.split(':').map(Number)
  const start = new Date(session.date); start.setHours(sh, sm, 0, 0)
  const end = new Date(session.date); end.setHours(sh + 3, 0, 0, 0)

  const results: any[] = []
  for (const r of records) {
    const existing = await db.attendance.findFirst({ where: { sessionId, userId: r.userId } })
    const before = existing ? { status: existing.status, method: existing.method } : null
    const isLate = r.status === 'HADIR' && r.checkInAt && (new Date(r.checkInAt).getTime() - start.getTime()) / 60000 > session.lateAfterMin
    const finalStatus = isLate ? 'LEWAT' : r.status

    let attendance
    if (existing) {
      attendance = await db.attendance.update({
        where: { id: existing.id },
        data: {
          status: finalStatus,
          method: 'MANUAL',
          checkInAt: r.checkInAt ? new Date(r.checkInAt) : (finalStatus === 'HADIR' || finalStatus === 'LEWAT' ? start : null),
          checkOutAt: (finalStatus === 'HADIR' || finalStatus === 'LEWAT') ? end : null,
          remarks: r.remarks || null,
          recordedById: recorderId,
        }
      })
    } else {
      attendance = await db.attendance.create({
        data: {
          sessionId, userId: r.userId,
          status: finalStatus,
          method: 'MANUAL',
          checkInAt: (finalStatus === 'HADIR' || finalStatus === 'LEWAT') ? start : null,
          checkOutAt: (finalStatus === 'HADIR' || finalStatus === 'LEWAT') ? end : null,
          remarks: r.remarks || null,
          recordedById: recorderId,
        }
      })
    }
    await db.auditLog.create({
      data: {
        userId: recorderId, action: 'BULK_ATTENDANCE', entity: 'attendance', entityId: attendance.id,
        before: before ? JSON.stringify(before) : null,
        after: JSON.stringify({ status: finalStatus, method: 'MANUAL' }),
      }
    })
    results.push(attendance)
  }
  return NextResponse.json({ count: results.length, attendances: results })
}
