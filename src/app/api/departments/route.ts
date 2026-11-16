import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  const departments = await db.department.findMany({ include: { users: true, head: true } })
  return NextResponse.json({ departments })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const c = await cookies()
  const userId = c.get('lms_session')?.value

  if (!body.code || !body.name) {
    return NextResponse.json({ error: 'Kod dan nama diperlukan' }, { status: 400 })
  }

  const dept = await db.department.create({
    data: {
      code: body.code,
      name: body.name,
      headUserId: body.headUserId || null,
    },
    include: { head: true, users: true },
  })

  await db.auditLog.create({
    data: {
      userId,
      action: 'CREATE_DEPARTMENT',
      entity: 'department',
      entityId: dept.id,
      after: JSON.stringify({ code: dept.code, name: dept.name }),
    },
  })

  return NextResponse.json({ department: dept })
}
