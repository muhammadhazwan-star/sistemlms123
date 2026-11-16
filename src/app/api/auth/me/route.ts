import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const c = await cookies()
  const sessionId = c.get('lms_session')?.value
  if (!sessionId) return NextResponse.json({ user: null })
  const user = await db.user.findUnique({
    where: { id: sessionId },
    include: { department: true }
  })
  if (!user) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: {
      id: user.id, staffNo: user.staffNo, name: user.name, email: user.email,
      role: user.role, departmentId: user.departmentId, position: user.position,
      language: user.language, avatarColor: user.avatarColor, department: user.department
    }
  })
}
