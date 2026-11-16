import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// RPT-01 - Completion by staff/department
export async function GET() {
  const enrollments = await db.enrollment.findMany({
    include: { user: { include: { department: true } }, course: true }
  })

  const byStaff: Record<string, { name: string; department: string; total: number; completed: number; avgProgress: number }> = {}
  const byDept: Record<string, { total: number; completed: number; staff: Set<string> }> = {}

  for (const e of enrollments) {
    const key = e.userId
    const deptName = e.user.department?.name || 'Tanpa Jabatan'
    if (!byStaff[key]) byStaff[key] = { name: e.user.name, department: deptName, total: 0, completed: 0, avgProgress: 0 }
    byStaff[key].total++
    if (e.status === 'COMPLETED') byStaff[key].completed++
    byStaff[key].avgProgress += e.progressPct

    if (!byDept[deptName]) byDept[deptName] = { total: 0, completed: 0, staff: new Set() }
    byDept[deptName].total++
    if (e.status === 'COMPLETED') byDept[deptName].completed++
    byDept[deptName].staff.add(e.userId)
  }

  const staffRows = Object.entries(byStaff).map(([uid, v]) => ({
    userId: uid, name: v.name, department: v.department,
    total: v.total, completed: v.completed,
    avgProgress: v.total ? Math.round(v.avgProgress / v.total) : 0,
    completionRate: v.total ? Math.round((v.completed / v.total) * 100) : 0,
  }))

  const deptRows = Object.entries(byDept).map(([dept, v]) => ({
    department: dept,
    staffCount: v.staff.size,
    total: v.total,
    completed: v.completed,
    completionRate: v.total ? Math.round((v.completed / v.total) * 100) : 0,
  }))

  return NextResponse.json({
    totalEnrollments: enrollments.length,
    totalCompleted: enrollments.filter(e => e.status === 'COMPLETED').length,
    staffRows,
    deptRows,
  })
}
