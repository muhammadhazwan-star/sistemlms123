import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Detect if request came over HTTPS (through gateway/proxy) for proper cookie flags
function isSecure(req: NextRequest): boolean {
  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedProto === 'https') return true
  return req.nextUrl.protocol === 'https:'
}

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
  const secure = isSecure(req)
  // SameSite=None + Secure for HTTPS (allows iframe cookies in preview panel)
  // SameSite=Lax for localhost HTTP (standard browser behavior)
  c.set('lms_session', user.id, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  await db.auditLog.create({ data: { userId: user.id, action: 'LOGIN', entity: 'auth', entityId: user.id, after: 'User logged in' } })
  return NextResponse.json({ user: safe })
}
