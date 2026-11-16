import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// RPT-02 - Attendance reports
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const groupBy = searchParams.get('groupBy') || 'session' // session, staff, department

  const attendances = await db.attendance.findMany({
    include: {
      user: { include: { department: true } },
      session: { include: { course: true } }
    }
  })

  if (groupBy === 'staff') {
    const map: Record<string, { name: string; department: string; hadir: number; lewat: number; tidakHadir: number; cuti: number; dikecualikan: number; total: number }> = {}
    for (const a of attendances) {
      const k = a.userId
      const dept = a.user.department?.name || 'Tanpa Jabatan'
      if (!map[k]) map[k] = { name: a.user.name, department: dept, hadir: 0, lewat: 0, tidakHadir: 0, cuti: 0, dikecualikan: 0, total: 0 }
      map[k].total++
      if (a.status === 'HADIR') map[k].hadir++
      if (a.status === 'LEWAT') map[k].lewat++
      if (a.status === 'TIDAK_HADIR') map[k].tidakHadir++
      if (a.status === 'CUTI') map[k].cuti++
      if (a.status === 'DIKECUALIKAN') map[k].dikecualikan++
    }
    const rows = Object.entries(map).map(([uid, v]) => ({
      userId: uid, name: v.name, department: v.department,
      ...v,
      rate: v.total ? Math.round(((v.hadir + v.lewat) / v.total) * 100) : 0,
    }))
    return NextResponse.json({ groupBy, rows })
  }

  if (groupBy === 'department') {
    const map: Record<string, { hadir: number; lewat: number; tidakHadir: number; cuti: number; dikecualikan: number; total: number }> = {}
    for (const a of attendances) {
      const dept = a.user.department?.name || 'Tanpa Jabatan'
      if (!map[dept]) map[dept] = { hadir: 0, lewat: 0, tidakHadir: 0, cuti: 0, dikecualikan: 0, total: 0 }
      map[dept].total++
      if (a.status === 'HADIR') map[dept].hadir++
      if (a.status === 'LEWAT') map[dept].lewat++
      if (a.status === 'TIDAK_HADIR') map[dept].tidakHadir++
      if (a.status === 'CUTI') map[dept].cuti++
      if (a.status === 'DIKECUALIKAN') map[dept].dikecualikan++
    }
    const rows = Object.entries(map).map(([dept, v]) => ({
      department: dept, ...v,
      rate: v.total ? Math.round(((v.hadir + v.lewat) / v.total) * 100) : 0,
    }))
    return NextResponse.json({ groupBy, rows })
  }

  // by session
  const map: Record<string, { title: string; date: string; courseCode: string; hadir: number; lewat: number; tidakHadir: number; cuti: number; dikecualikan: number; total: number }> = {}
  for (const a of attendances) {
    const k = a.sessionId
    if (!map[k]) map[k] = {
      title: a.session.title,
      date: a.session.date.toISOString(),
      courseCode: a.session.course?.code || '',
      hadir: 0, lewat: 0, tidakHadir: 0, cuti: 0, dikecualikan: 0, total: 0
    }
    map[k].total++
    if (a.status === 'HADIR') map[k].hadir++
    if (a.status === 'LEWAT') map[k].lewat++
    if (a.status === 'TIDAK_HADIR') map[k].tidakHadir++
    if (a.status === 'CUTI') map[k].cuti++
    if (a.status === 'DIKECUALIKAN') map[k].dikecualikan++
  }
  const rows = Object.entries(map).map(([sid, v]) => ({
    sessionId: sid, ...v,
    rate: v.total ? Math.round(((v.hadir + v.lewat) / v.total) * 100) : 0,
  }))
  return NextResponse.json({ groupBy, rows })
}
