import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

function isSecure(req: NextRequest): boolean {
  const forwardedProto = req.headers.get('x-forwarded-proto')
  if (forwardedProto === 'https') return true
  const origin = req.headers.get('origin') || ''
  if (origin.startsWith('https://')) return true
  const referer = req.headers.get('referer') || ''
  if (referer.startsWith('https://')) return true
  return req.nextUrl.protocol === 'https:'
}

// Fallback: query user via Supabase REST API (HTTPS) if Prisma fails (IPv6 issue)
async function findUserViaRestApi(email: string): Promise<any | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/User?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) && data.length > 0 ? data[0] : null
  } catch {
    return null
  }
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

    // Try Prisma first
    let user: any = null
    try {
      user = await db.user.findFirst({
        where: { email: { equals: email.toLowerCase() } },
        include: { department: true }
      })
    } catch (prismaErr) {
      // Prisma failed (likely IPv6/connection issue) — try Supabase REST API fallback
      console.error('Prisma login failed, trying REST API fallback:', (prismaErr as Error).message?.slice(0, 100))
      user = await findUserViaRestApi(email)
      if (user) {
        // Fetch department via REST API too
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (user.departmentId && supabaseUrl && supabaseKey) {
          try {
            const deptRes = await fetch(
              `${supabaseUrl}/rest/v1/Department?id=eq.${user.departmentId}&select=*&limit=1`,
              { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
            )
            if (deptRes.ok) {
              const deptData = await deptRes.json()
              user.department = deptData?.[0] || null
            }
          } catch {}
        }
      }
    }

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
    } catch {}

    return NextResponse.json({ user: safe })
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Ralat pelayan semasa log masuk. Sila cuba lagi.' },
      { status: 500 }
    )
  }
}
