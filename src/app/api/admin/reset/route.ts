import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Reset dummy data (ADM-04) - re-run seed
export async function POST() {
  // Trigger seed via subprocess? In Next.js we cannot easily run another script.
  // Instead, we provide an endpoint that just clears data and signals to re-seed.
  // For simplicity, we just return instruction; client can call /api/seed if exists.
  await db.auditLog.deleteMany()
  await db.notification.deleteMany()
  await db.certificate.deleteMany()
  await db.attendanceCorrection.deleteMany()
  await db.attendance.deleteMany()
  await db.session.deleteMany()
  await db.quizAttempt.deleteMany()
  await db.lessonProgress.deleteMany()
  await db.enrollment.deleteMany()
  await db.question.deleteMany()
  await db.quiz.deleteMany()
  await db.lesson.deleteMany()
  await db.module.deleteMany()
  await db.course.deleteMany()
  // keep users/depts/categories
  return NextResponse.json({ ok: true, message: 'Data kehadiran, pendaftaran dan sijil telah dipadam. Pengguna, jabatan dan kategori dikekalkan.' })
}
