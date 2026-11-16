import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// RPT-03 - Quiz results and hardest questions
export async function GET() {
  const attempts = await db.quizAttempt.findMany({
    include: { quiz: { include: { course: true, questions: true } }, user: true }
  })
  const totalAttempts = attempts.length
  const passedAttempts = attempts.filter(a => a.passed).length
  const avgScore = totalAttempts ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / totalAttempts) : 0

  // Hardest questions: count wrong answers
  const wrongCount: Record<string, { questionId: string; text: string; wrong: number; total: number }> = {}
  for (const a of attempts) {
    const ans = JSON.parse(a.answers || '{}')
    for (const q of a.quiz.questions) {
      const key = q.id
      if (!wrongCount[key]) wrongCount[key] = { questionId: q.id, text: q.text, wrong: 0, total: 0 }
      wrongCount[key].total++
      const ua = String(ans[q.id] ?? '').trim().toLowerCase()
      const ca = String(q.correctAnswer).trim().toLowerCase()
      let correct = false
      if (q.type === 'SHORT_ANSWER') correct = ua.length > 0 && (ua.includes(ca) || ca.includes(ua))
      else correct = ua === ca
      if (!correct) wrongCount[key].wrong++
    }
  }
  const hardest = Object.values(wrongCount)
    .filter(q => q.total > 0)
    .map(q => ({ ...q, wrongRate: Math.round((q.wrong / q.total) * 100) }))
    .sort((a, b) => b.wrongRate - a.wrongRate)
    .slice(0, 10)

  return NextResponse.json({
    totalAttempts,
    passedAttempts,
    passRate: totalAttempts ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
    avgScore,
    hardest,
  })
}
