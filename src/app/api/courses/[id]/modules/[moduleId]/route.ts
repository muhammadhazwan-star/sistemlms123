import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  const { moduleId } = await params
  const body = await req.json()
  const mod = await db.module.update({
    where: { id: moduleId },
    data: { title: body.title, order: body.order },
    include: { lessons: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json({ module: mod })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  const { moduleId } = await params
  await db.module.delete({ where: { id: moduleId } })
  return NextResponse.json({ ok: true })
}
