import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quizzes = await db.quiz.findMany({
    where: { courseId: id },
    include: { questions: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json({ quizzes })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const quiz = await db.quiz.create({
    data: {
      courseId: id,
      title: body.title || 'Kuiz Baru',
      timeLimitMin: body.timeLimitMin ?? 20,
      maxAttempts: body.maxAttempts ?? 3,
      passMark: body.passMark ?? 70,
    },
    include: { questions: true },
  })
  return NextResponse.json({ quiz })
}
