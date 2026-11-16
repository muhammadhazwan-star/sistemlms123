import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const courseId = searchParams.get('courseId')

  const where: any = {}
  if (userId) where.userId = userId
  if (courseId) where.courseId = courseId

  const enrollments = await db.enrollment.findMany({
    where,
    include: {
      course: { include: { category: true, instructor: true, modules: { include: { lessons: true } } } },
      user: { include: { department: true } },
      assigner: true,
    },
  })
  return NextResponse.json({ enrollments })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const c = await cookies()
  const assignerId = c.get('lms_session')?.value

  // Check existing
  const existing = await db.enrollment.findFirst({ where: { userId: body.userId, courseId: body.courseId } })
  if (existing) return NextResponse.json({ enrollment: existing })

  const enrollment = await db.enrollment.create({
    data: {
      userId: body.userId,
      courseId: body.courseId,
      assignedBy: assignerId,
      status: 'NOT_STARTED',
      progressPct: 0,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    }
  })

  await db.notification.create({
    data: {
      userId: body.userId,
      type: 'enrollment',
      message: 'Kursus baru telah ditugaskan kepada anda',
      read: false,
    }
  })

  const c2 = await cookies()
  const aid = c2.get('lms_session')?.value
  await db.auditLog.create({ data: { userId: aid, action: 'ASSIGN_COURSE', entity: 'enrollment', entityId: enrollment.id, after: body.courseId } })

  return NextResponse.json({ enrollment })
}
