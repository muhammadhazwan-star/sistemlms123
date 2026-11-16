import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function isSecure(req: NextRequest): boolean {
  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedProto === 'https') return true
  return req.nextUrl.protocol === 'https:'
}

export async function POST(req: NextRequest) {
  const c = await cookies()
  const secure = isSecure(req)
  c.set('lms_session', '', {
    httpOnly: true,
    sameSite: secure ? 'none' : 'lax',
    secure,
    path: '/',
    maxAge: 0,
  })
  return NextResponse.json({ ok: true })
}
