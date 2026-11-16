import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Detect if request came over HTTPS for proper cookie flags
// Check multiple sources: X-Forwarded-Proto, Origin header, and request protocol
function isSecure(req: NextRequest): boolean {
  // 1. Standard proxy header
  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedProto === 'https') return true
  // 2. Origin header from browser (reliable through Caddy gateway)
  const origin = req.headers.get('origin') || ''
  if (origin.startsWith('https://')) return true
  // 3. Referer header
  const referer = req.headers.get('referer') || ''
  if (referer.startsWith('https://')) return true
  // 4. Direct request protocol
  return req.nextUrl.protocol === 'https:'
}

export async function POST(req: NextRequest) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Format permintaan tidak sah' }, { status: 400 })
    }

    const email = (body?.email || '').toString().trim()
    const password = (body?.password || '').toString()

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
      return NextResponse.json({ error: 'Akaun tidak aktif. Sila hubungi pentadbir.' }, { status: 403 })
    }

    const safe = {
      id: user.id, staffNo: user.staffNo, name: user.name, email: user.email,
      role: user.role, departmentId: user.departmentId, position: user.position,
      language: user.language, avatarColor: user.avatarColor, department: user.department
    }

    const c = await cookies()
    const secure = isSecure(req)
    c.set('lms_session', user.id, {
      httpOnly: true,
      sameSite: secure ? 'none' : 'lax',
      secure,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    try {
      await db.auditLog.create({
        data: { userId: user.id, action: 'LOGIN', entity: 'auth', entityId: user.id, after: 'User logged in' }
      })
    } catch {
      // Audit log failure should not block login
    }

    return NextResponse.json({ user: safe })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Ralat pelayan semasa log masuk. Sila cuba lagi.' },
      { status: 500 }
    )
  }
}
