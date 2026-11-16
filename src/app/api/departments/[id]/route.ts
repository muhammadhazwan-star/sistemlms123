import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const c = await cookies()
  const userId = c.get('lms_session')?.value

  const before = await db.department.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Tidak dijumpai' }, { status: 404 })

  const dept = await db.department.update({
    where: { id },
    data: {
      code: body.code ?? before.code,
      name: body.name ?? before.name,
      headUserId: body.headUserId === undefined ? before.headUserId : (body.headUserId || null),
    },
    include: { head: true, users: true },
  })

  await db.auditLog.create({
    data: {
      userId,
      action: 'UPDATE_DEPARTMENT',
      entity: 'department',
      entityId: id,
      before: JSON.stringify({ code: before.code, name: before.name }),
      after: JSON.stringify({ code: dept.code, name: dept.name }),
    },
  })

  return NextResponse.json({ department: dept })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await cookies()
  const userId = c.get('lms_session')?.value

  const before = await db.department.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Tidak dijumpai' }, { status: 404 })

  // Detach users from this department before deletion (set departmentId = null)
  await db.user.updateMany({ where: { departmentId: id }, data: { departmentId: null } })
  await db.department.delete({ where: { id } })

  await db.auditLog.create({
    data: {
      userId,
      action: 'DELETE_DEPARTMENT',
      entity: 'department',
      entityId: id,
      before: JSON.stringify({ code: before.code, name: before.name }),
    },
  })

  return NextResponse.json({ ok: true })
}
