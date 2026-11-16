import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

// Mark lesson as completed (LRN-01, LRN-02)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params
  const body = await req.json()
  const c = await cookies()
  const userId = c.get('lms_session')?.value
  if (!userId) return NextResponse.json({ error: 'Tidak log masuk' }, { status: 401 })

  const existing = await db.lessonProgress.findFirst({ where: { userId, lessonId } })
  let progress
  if (existing) {
    progress = await db.lessonProgress.update({
      where: { id: existing.id },
      data: { completed: body.completed ?? true, lastPosition: body.lastPosition ?? existing.lastPosition }
    })
  } else {
    progress = await db.lessonProgress.create({
      data: { userId, lessonId, completed: body.completed ?? true, lastPosition: body.lastPosition }
    })
  }

  // Recompute course progress
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, include: { module: true } })
  if (lesson?.module?.courseId) {
    const courseId = lesson.module.courseId
    const allLessons = await db.lesson.findMany({
      where: { module: { courseId } },
    })
    const completed = await db.lessonProgress.findMany({
      where: { userId, lessonId: { in: allLessons.map(l => l.id) }, completed: true }
    })
    const pct = Math.round((completed.length / allLessons.length) * 100)
    const enrollment = await db.enrollment.findFirst({ where: { userId, courseId } })
    if (enrollment) {
      await db.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progressPct: pct,
          status: pct === 100 ? 'COMPLETED' : pct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
          completedAt: pct === 100 ? new Date() : enrollment.completedAt,
        }
      })

      // Auto-generate certificate if 100% complete
      if (pct === 100) {
        const quiz = await db.quiz.findFirst({ where: { courseId } })
        let passedQuiz = true
        if (quiz) {
          const attempts = await db.quizAttempt.findMany({ where: { userId, quizId: quiz.id, passed: true } })
          passedQuiz = attempts.length > 0
        }
        const existingCert = await db.certificate.findFirst({ where: { userId, courseId } })
        if (passedQuiz && !existingCert) {
          const certNo = `LMS-AA-${Date.now().toString().slice(-7)}`
          const verifyCode = Math.random().toString(36).slice(2, 10).toUpperCase()
          await db.certificate.create({
            data: { userId, courseId, certNo, issuedAt: new Date(), expiresAt: new Date(Date.now() + 365 * 86400000), verifyCode }
          })
          await db.notification.create({
            data: { userId, type: 'certificate', message: `Sijil baru dikeluarkan (${certNo})`, read: false }
          })
        }
      }
    }
  }

  return NextResponse.json({ progress })
}
