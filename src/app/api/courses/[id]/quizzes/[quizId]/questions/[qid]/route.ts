import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; quizId: string; qid: string }> }) {
  const { qid } = await params
  const body = await req.json()
  const options = body.options || []
  const question = await db.question.update({
    where: { id: qid },
    data: {
      type: body.type,
      text: body.text,
      options: JSON.stringify(options),
      correctAnswer: body.correctAnswer,
      explanation: body.explanation,
      points: body.points,
      order: body.order,
    },
  })
  return NextResponse.json({ question })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; quizId: string; qid: string }> }) {
  const { qid } = await params
  await db.question.delete({ where: { id: qid } })
  return NextResponse.json({ ok: true })
}
