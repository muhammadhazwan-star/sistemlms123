import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const verifyCode = searchParams.get('verifyCode')

  if (verifyCode) {
    const cert = await db.certificate.findFirst({
      where: { verifyCode },
      include: { user: true, course: true }
    })
    if (!cert) return NextResponse.json({ valid: false })
    return NextResponse.json({
      valid: true,
      certificate: {
        certNo: cert.certNo,
        issuedAt: cert.issuedAt,
        expiresAt: cert.expiresAt,
        userName: cert.user.name,
        staffNo: cert.user.staffNo,
        courseTitle: cert.course.title,
        courseCode: cert.course.code,
      }
    })
  }

  const where: any = {}
  if (userId) where.userId = userId
  const certificates = await db.certificate.findMany({
    where,
    include: { course: true },
    orderBy: { issuedAt: 'desc' }
  })
  return NextResponse.json({ certificates })
}
