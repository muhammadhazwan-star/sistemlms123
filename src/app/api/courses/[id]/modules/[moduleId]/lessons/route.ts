import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; moduleId: string }> }) {
  const { moduleId } = await params
  const body = await req.json()
  const count = await db.lesson.count({ where: { moduleId } })
  const lesson = await db.lesson.create({
    data: {
      moduleId,
      title: body.title || 'Pelajaran Baru',
      type: body.type || 'TEXT',
      content: body.content || '',
      durationMin: body.durationMin ?? 15,
      order: body.order ?? count + 1,
    },
  })
  return NextResponse.json({ lesson })
}
