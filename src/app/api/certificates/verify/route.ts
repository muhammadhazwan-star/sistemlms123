import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Public verification (CERT-02)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const certNo = searchParams.get('certNo')
  const verifyCode = searchParams.get('verifyCode')

  if (!certNo && !verifyCode) {
    return NextResponse.json({ error: 'Sertakan nombor sijil atau kod pengesahan' }, { status: 400 })
  }

  const where: any = {}
  if (certNo) where.certNo = certNo
  if (verifyCode) where.verifyCode = verifyCode

  const cert = await db.certificate.findFirst({
    where,
    include: { user: { include: { department: true } }, course: true }
  })
  if (!cert) return NextResponse.json({ valid: false })

  return NextResponse.json({
    valid: true,
    certificate: {
      certNo: cert.certNo,
      verifyCode: cert.verifyCode,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      userName: cert.user.name,
      staffNo: cert.user.staffNo,
      department: cert.user.department?.name,
      courseTitle: cert.course.title,
      courseCode: cert.course.code,
    }
  })
}
