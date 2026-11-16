import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Import attendance from CSV (ATT-06). Body: { rows: [{ staffNo, status, checkIn, remarks }] }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const body = await req.json()
  const { rows } = body
  const c = await cookies()
  const recorderId = c.get('lms_session')?.value

  const session = await db.session.findUnique({ where: { id: sessionId } })
  if (!session) return NextResponse.json({ error: 'Sesi tidak dijumpai' }, { status: 404 })

  const validStatuses = ['HADIR', 'LEWAT', 'TIDAK_HADIR', 'CUTI', 'DIKECUALIKAN']
  const [sh, sm] = session.startTime.split(':').map(Number)
  const start = new Date(session.date); start.setHours(sh, sm, 0, 0)
  const end = new Date(session.date); end.setHours(sh + 3, 0, 0, 0)

  const errors: { row: number; staffNo: string; reason: string }[] = []
  const preview: { staffNo: string; userId?: string; name?: string; status: string; valid: boolean; reason?: string }[] = []
  const validRows: { userId: string; status: string; checkIn?: Date; remarks?: string; staffNo: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const staffNo = (r.staffNo || '').trim()
    const status = (r.status || '').trim().toUpperCase()
    if (!staffNo) {
      errors.push({ row: i + 2, staffNo, reason: 'Nombor staf kosong' })
      preview.push({ staffNo, status, valid: false, reason: 'Nombor staf kosong' })
      continue
    }
    if (!validStatuses.includes(status)) {
      errors.push({ row: i + 2, staffNo, reason: `Status tidak sah: ${status}` })
      preview.push({ staffNo, status, valid: false, reason: `Status tidak sah: ${status}` })
      continue
    }
    const user = await db.user.findFirst({ where: { staffNo } })
    if (!user) {
      errors.push({ row: i + 2, staffNo, reason: `Staf tidak dijumpai: ${staffNo}` })
      preview.push({ staffNo, status, valid: false, reason: `Staf tidak dijumpai` })
      continue
    }
    let checkIn: Date | undefined
    if (r.checkIn && status === 'HADIR') {
      const [h, m] = String(r.checkIn).split(':').map(Number)
      checkIn = new Date(session.date); checkIn.setHours(h || sh, m || sm, 0, 0)
      const diff = (checkIn.getTime() - start.getTime()) / 60000
      if (diff > session.lateAfterMin) {
        // Will be marked as LEWAT
      }
    }
    preview.push({ staffNo, userId: user.id, name: user.name, status, valid: true })
    validRows.push({ userId: user.id, status, checkIn, remarks: r.remarks, staffNo })
  }

  // Apply only if commit=true
  if (body.commit) {
    for (const r of validRows) {
      const existing = await db.attendance.findFirst({ where: { sessionId, userId: r.userId } })
      const isLate = r.status === 'HADIR' && r.checkIn && (r.checkIn.getTime() - start.getTime()) / 60000 > session.lateAfterMin
      const finalStatus = isLate ? 'LEWAT' : r.status
      if (existing) {
        await db.attendance.update({
          where: { id: existing.id },
          data: { status: finalStatus as any, method: 'IMPORT', checkInAt: r.checkIn ?? (finalStatus === 'HADIR' || finalStatus === 'LEWAT' ? start : null), checkOutAt: (finalStatus === 'HADIR' || finalStatus === 'LEWAT') ? end : null, remarks: r.remarks || null, recordedById: recorderId }
        })
      } else {
        await db.attendance.create({
          data: { sessionId, userId: r.userId, status: finalStatus as any, method: 'IMPORT', checkInAt: r.checkIn ?? (finalStatus === 'HADIR' || finalStatus === 'LEWAT' ? start : null), checkOutAt: (finalStatus === 'HADIR' || finalStatus === 'LEWAT') ? end : null, remarks: r.remarks || null, recordedById: recorderId }
        })
      }
      await db.auditLog.create({ data: { userId: recorderId, action: 'IMPORT_ATTENDANCE', entity: 'attendance', after: JSON.stringify({ staffNo: r.staffNo, status: finalStatus }) } })
    }
  }

  return NextResponse.json({
    total: rows.length,
    valid: validRows.length,
    errors: errors.length,
    errorList: errors,
    preview,
    committed: !!body.commit,
  })
}
