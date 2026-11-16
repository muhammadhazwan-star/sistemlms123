import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'E-mel dan kata laluan diperlukan' }, { status: 400 })
  }
  const user = await db.user.findFirst({
    where: { email: { equals: email.toLowerCase() } },
    include: { department: true }
  })
  if (!user || user.passwordHash !== password) {
    return NextResponse.json({ error: 'E-mel atau kata laluan tidak sah' }, { status: 401 })
  }
  if (user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Akaun tidak aktif' }, { status: 403 })
  }
  const safe = { id: user.id, staffNo: user.staffNo, name: user.name, email: user.email, role: user.role, departmentId: user.departmentId, position: user.position, language: user.language, avatarColor: user.avatarColor, department: user.department }
  const c = await cookies()
  c.set('lms_session', user.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
  await db.auditLog.create({ data: { userId: user.id, action: 'LOGIN', entity: 'auth', entityId: user.id, after: 'User logged in' } })
  return NextResponse.json({ user: safe })
}
