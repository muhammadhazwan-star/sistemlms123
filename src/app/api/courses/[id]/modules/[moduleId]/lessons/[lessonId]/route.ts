import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }) {
  const { lessonId } = await params
  const body = await req.json()
  const lesson = await db.lesson.update({
    where: { id: lessonId },
    data: {
      title: body.title,
      type: body.type,
      content: body.content,
      durationMin: body.durationMin,
      order: body.order,
    },
  })
  return NextResponse.json({ lesson })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string; lessonId: string }> }) {
  const { lessonId } = await params
  await db.lesson.delete({ where: { id: lessonId } })
  return NextResponse.json({ ok: true })
}
