import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; quizId: string }> }) {
  const { quizId } = await params
  const body = await req.json()
  const count = await db.question.count({ where: { quizId } })
  const options = body.options || []
  const question = await db.question.create({
    data: {
      quizId,
      type: body.type || 'MULTIPLE_CHOICE',
      text: body.text || 'Soalan Baru',
      options: JSON.stringify(options),
      correctAnswer: body.correctAnswer || '',
      explanation: body.explanation || null,
      points: body.points ?? 1,
      order: body.order ?? count + 1,
    },
  })
  return NextResponse.json({ question })
}
