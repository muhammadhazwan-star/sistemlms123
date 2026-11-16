import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

function isSecure(req: NextRequest): boolean {
  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedProto === 'https') return true
  return req.nextUrl.protocol === 'https:'
}

// Demo: switch role quickly (AUTH-03)
export async function POST(req: NextRequest) {
  const { role } = await req.json()
  const c = await cookies()
  const currentId = c.get('lms_session')?.value
  if (!currentId) return NextResponse.json({ error: 'Tidak log masuk' }, { status: 401 })

  // Find a user with that role
  const target = await db.user.findFirst({ where: { role }, include: { department: true } })
  if (!target) return NextResponse.json({ error: 'Peranan tidak dijumpai' }, { status: 404 })

  const secure = isSecure(req)
  c.set('lms_session', target.id, {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return NextResponse.json({
    user: {
      id: target.id, staffNo: target.staffNo, name: target.name, email: target.email,
      role: target.role, departmentId: target.departmentId, position: target.position,
      language: target.language, avatarColor: target.avatarColor, department: target.department
    }
  })
}
