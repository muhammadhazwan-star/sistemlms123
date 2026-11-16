import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Submit a quiz attempt (LRN-03, LRN-04)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params
  const c = await cookies()
  const userId = c.get('lms_session')?.value
  if (!userId) return NextResponse.json({ error: 'Tidak log masuk' }, { status: 401 })

  const body = await req.json()
  const { answers } = body // { questionId: userAnswer }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true, course: true }
  })
  if (!quiz) return NextResponse.json({ error: 'Kuiz tidak dijumpai' }, { status: 404 })

  // Check attempt count
  const attempts = await db.quizAttempt.findMany({ where: { userId, quizId } })
  if (attempts.length >= quiz.maxAttempts) {
    return NextResponse.json({ error: `Had cubaan (${quiz.maxAttempts}) telah dicapai` }, { status: 400 })
  }

  // Calculate score
  let correct = 0
  const graded: { questionId: string; userAnswer: string; correct: boolean; correctAnswer: string; explanation?: string }[] = []
  for (const q of quiz.questions) {
    const ua = String(answers[q.id] ?? '').trim().toLowerCase()
    const ca = String(q.correctAnswer).trim().toLowerCase()
    let isCorrect = false
    if (q.type === 'SHORT_ANSWER') {
      // Loose match: contains keyword from correct answer
      isCorrect = ua.length > 0 && (ua.includes(ca) || ca.includes(ua))
    } else {
      isCorrect = ua === ca
    }
    if (isCorrect) correct++
    graded.push({ questionId: q.id, userAnswer: String(answers[q.id] ?? ''), correct: isCorrect, correctAnswer: q.correctAnswer, explanation: q.explanation || undefined })
  }
  const totalPoints = quiz.questions.length
  const score = Math.round((correct / totalPoints) * 100)
  const passed = score >= quiz.passMark

  const attempt = await db.quizAttempt.create({
    data: {
      userId, quizId, score, passed,
      answers: JSON.stringify(answers),
      submittedAt: new Date(),
    }
  })

  // If passed, check for cert generation
  if (passed) {
    const enrollment = await db.enrollment.findFirst({ where: { userId, courseId: quiz.courseId } })
    if (enrollment && enrollment.progressPct === 100) {
      const existingCert = await db.certificate.findFirst({ where: { userId, courseId: quiz.courseId } })
      if (!existingCert) {
        const certNo = `LMS-AA-${Date.now().toString().slice(-7)}`
        const verifyCode = Math.random().toString(36).slice(2, 10).toUpperCase()
        await db.certificate.create({
          data: { userId, courseId: quiz.courseId, certNo, issuedAt: new Date(), expiresAt: new Date(Date.now() + 365 * 86400000), verifyCode }
        })
        await db.notification.create({
          data: { userId, type: 'certificate', message: `Sijil baru dikeluarkan (${certNo})`, read: false }
        })
      }
    }
  }

  return NextResponse.json({ attempt, graded, score, passed })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = await params
  const c = await cookies()
  const userId = c.get('lms_session')?.value
  const attempts = await db.quizAttempt.findMany({
    where: { userId: userId || '_', quizId },
    orderBy: { submittedAt: 'desc' }
  })
  return NextResponse.json({ attempts })
}
