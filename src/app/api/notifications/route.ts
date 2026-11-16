import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const c = await cookies()
  const userId = c.get('lms_session')?.value
  if (!userId) return NextResponse.json({ notifications: [] })
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ notifications })
}

export async function PUT(req: NextRequest) {
  const c = await cookies()
  const userId = c.get('lms_session')?.value
  const body = await req.json()
  if (body.markAllRead) {
    await db.notification.updateMany({ where: { userId, read: false }, data: { read: true } })
    return NextResponse.json({ ok: true })
  }
  if (body.id) {
    await db.notification.update({ where: { id: body.id }, data: { read: body.read } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false })
}
