import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await db.course.findUnique({
    where: { id },
    include: {
      category: true,
      instructor: true,
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      },
      quizzes: { include: { questions: { orderBy: { order: 'asc' } } } },
      enrollments: { include: { user: true } },
      sessions: true,
    },
  })
  if (!course) return NextResponse.json({ error: 'Kursus tidak dijumpai' }, { status: 404 })
  return NextResponse.json({ course })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const course = await db.course.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      level: body.level,
      language: body.language,
      durationHours: body.durationHours,
      status: body.status,
      passMark: body.passMark,
      minAttendancePct: body.minAttendancePct,
      outcomes: (body.outcomes || []).join('\n'),
      syllabus: (body.syllabus || []).join('\n'),
    },
  })
  return NextResponse.json({ course })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.course.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
