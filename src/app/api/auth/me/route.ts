import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Fallback: query user via Supabase REST API if Prisma fails
async function getUserViaRestApi(userId: string): Promise<any | null> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) return null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/User?id=eq.${userId}&select=*&limit=1`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const user = Array.isArray(data) && data.length > 0 ? data[0] : null
    if (user && user.departmentId) {
      const deptRes = await fetch(
        `${supabaseUrl}/rest/v1/Department?id=eq.${user.departmentId}&select=*&limit=1`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      )
      if (deptRes.ok) {
        const deptData = await deptRes.json()
        user.department = deptData?.[0] || null
      }
    }
    return user
  } catch {
    return null
  }
}

export async function GET() {
  const c = await cookies()
  const sessionId = c.get('lms_session')?.value
  if (!sessionId) return NextResponse.json({ user: null })

  let user: any = null
  try {
    user = await db.user.findUnique({
      where: { id: sessionId },
      include: { department: true }
    })
  } catch {
    // Prisma failed — try REST API fallback
    user = await getUserViaRestApi(sessionId)
  }

  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: {
      id: user.id, staffNo: user.staffNo, name: user.name, email: user.email,
      role: user.role, departmentId: user.departmentId, position: user.position,
      language: user.language, avatarColor: user.avatarColor, department: user.department
    }
  })
}
