import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { quizId } = await params
  const body = await req.json()
  const quiz = await db.quiz.update({
    where: { id: quizId },
    data: {
      title: body.title,
      timeLimitMin: body.timeLimitMin,
      maxAttempts: body.maxAttempts,
      passMark: body.passMark,
    },
    include: { questions: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json({ quiz })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { quizId } = await params
  await db.quiz.delete({ where: { id: quizId } })
  return NextResponse.json({ ok: true })
}
