import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const c = await cookies()
  const userId = c.get('lms_session')?.value

  const before = await db.category.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Tidak dijumpai' }, { status: 404 })

  const cat = await db.category.update({
    where: { id },
    data: {
      name: body.name ?? before.name,
      description: body.description === undefined ? before.description : (body.description || null),
    },
    include: { _count: { select: { courses: true } } },
  })

  await db.auditLog.create({
    data: {
      userId,
      action: 'UPDATE_CATEGORY',
      entity: 'category',
      entityId: id,
      before: JSON.stringify({ name: before.name }),
      after: JSON.stringify({ name: cat.name }),
    },
  })

  return NextResponse.json({ category: cat })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await cookies()
  const userId = c.get('lms_session')?.value

  const before = await db.category.findUnique({ where: { id } })
  if (!before) return NextResponse.json({ error: 'Tidak dijumpai' }, { status: 404 })

  // Detach courses from category before deletion
  await db.course.updateMany({ where: { categoryId: id }, data: { categoryId: null } })
  await db.category.delete({ where: { id } })

  await db.auditLog.create({
    data: {
      userId,
      action: 'DELETE_CATEGORY',
      entity: 'category',
      entityId: id,
      before: JSON.stringify({ name: before.name }),
    },
  })

  return NextResponse.json({ ok: true })
}
