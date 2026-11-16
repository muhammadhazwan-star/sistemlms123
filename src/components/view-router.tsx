'use client'
import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// Lazy-loaded views
const DashboardStaff = React.lazy(() => import('@/components/staf/dashboard').then(m => ({ default: m.DashboardStaff })))
const Catalog = React.lazy(() => import('@/components/staf/catalog').then(m => ({ default: m.Catalog })))
const CourseDetail = React.lazy(() => import('@/components/staf/course-detail').then(m => ({ default: m.CourseDetail })))
const LearningPlayer = React.lazy(() => import('@/components/staf/learning-player').then(m => ({ default: m.LearningPlayer })))
const QuizPlayer = React.lazy(() => import('@/components/staf/quiz-player').then(m => ({ default: m.QuizPlayer })))
const MyCourses = React.lazy(() => import('@/components/staf/my-courses').then(m => ({ default: m.MyCourses })))
const MyAttendance = React.lazy(() => import('@/components/staf/my-attendance').then(m => ({ default: m.MyAttendance })))
const MyCertificates = React.lazy(() => import('@/components/staf/my-certificates').then(m => ({ default: m.MyCertificates })))
const Profile = React.lazy(() => import('@/components/common/profile').then(m => ({ default: m.Profile })))

const TrainerCourses = React.lazy(() => import('@/components/jurulatih/trainer-courses').then(m => ({ default: m.TrainerCourses })))
const CourseEditor = React.lazy(() => import('@/components/jurulatih/course-editor').then(m => ({ default: m.CourseEditor })))
const SessionSchedule = React.lazy(() => import('@/components/jurulatih/session-schedule').then(m => ({ default: m.SessionSchedule })))
const QrDisplay = React.lazy(() => import('@/components/jurulatih/qr-display').then(m => ({ default: m.QrDisplay })))
const AttendanceList = React.lazy(() => import('@/components/jurulatih/attendance-list').then(m => ({ default: m.AttendanceList })))

const TeamDashboard = React.lazy(() => import('@/components/hr-admin/team-dashboard').then(m => ({ default: m.TeamDashboard })))
const AssignCourse = React.lazy(() => import('@/components/hr-admin/assign-course').then(m => ({ default: m.AssignCourse })))
const ApproveCorrection = React.lazy(() => import('@/components/hr-admin/approve-correction').then(m => ({ default: m.ApproveCorrection })))
const Reports = React.lazy(() => import('@/components/hr-admin/reports').then(m => ({ default: m.Reports })))
const UsersAdmin = React.lazy(() => import('@/components/hr-admin/users-admin').then(m => ({ default: m.UsersAdmin })))
const DepartmentsAdmin = React.lazy(() => import('@/components/hr-admin/departments-admin').then(m => ({ default: m.DepartmentsAdmin })))
const AuditLog = React.lazy(() => import('@/components/hr-admin/audit-log').then(m => ({ default: m.AuditLog })))
const ResetData = React.lazy(() => import('@/components/hr-admin/reset-data').then(m => ({ default: m.ResetData })))
const VerifyCertificate = React.lazy(() => import('@/components/hr-admin/verify-certificate').then(m => ({ default: m.VerifyCertificate })))

function Suspense({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div className="h-96 rounded-3xl glass animate-pulse" />}>
      {children}
    </React.Suspense>
  )
}

export function ViewRouter() {
  const { user, view } = useAppStore()
  if (!user) return null

  const role = user.role

  // Allow verify-certificate for all (public)
  if (view === 'verify-certificate') return <Suspense><VerifyCertificate /></Suspense>

  // Staff + accessible to all roles for self-service
  if (view === 'dashboard') return <Suspense>{role === 'STAFF' ? <DashboardStaff /> : role === 'TRAINER' ? <DashboardStaff /> : role === 'HR' ? <TeamDashboard /> : <TeamDashboard />}</Suspense>
  if (view === 'catalog') return <Suspense><Catalog /></Suspense>
  if (view === 'course-detail') return <Suspense><CourseDetail /></Suspense>
  if (view === 'learning-player') return <Suspense><LearningPlayer /></Suspense>
  if (view === 'quiz-player') return <Suspense><QuizPlayer /></Suspense>
  if (view === 'my-courses') return <Suspense><MyCourses /></Suspense>
  if (view === 'my-attendance') return <Suspense><MyAttendance /></Suspense>
  if (view === 'my-certificates') return <Suspense><MyCertificates /></Suspense>
  if (view === 'profile') return <Suspense><Profile /></Suspense>

  // Trainer
  if (view === 'trainer-courses' && (role === 'TRAINER' || role === 'ADMIN')) return <Suspense><TrainerCourses /></Suspense>
  if (view === 'course-editor' && (role === 'TRAINER' || role === 'ADMIN')) return <Suspense><CourseEditor /></Suspense>
  if (view === 'session-schedule' && (role === 'TRAINER' || role === 'ADMIN' || role === 'HR')) return <Suspense><SessionSchedule /></Suspense>
  if (view === 'qr-display' && (role === 'TRAINER' || role === 'ADMIN')) return <Suspense><QrDisplay /></Suspense>
  if (view === 'attendance-list' && (role === 'TRAINER' || role === 'ADMIN' || role === 'HR')) return <Suspense><AttendanceList /></Suspense>

  // HR / Admin
  if (view === 'team-dashboard' && (role === 'HR' || role === 'ADMIN')) return <Suspense><TeamDashboard /></Suspense>
  if (view === 'assign-course' && (role === 'HR' || role === 'ADMIN')) return <Suspense><AssignCourse /></Suspense>
  if (view === 'approve-correction' && (role === 'HR' || role === 'ADMIN')) return <Suspense><ApproveCorrection /></Suspense>
  if (view === 'reports' && (role === 'HR' || role === 'ADMIN')) return <Suspense><Reports /></Suspense>
  if (view === 'users' && role === 'ADMIN') return <Suspense><UsersAdmin /></Suspense>
  if (view === 'departments' && role === 'ADMIN') return <Suspense><DepartmentsAdmin /></Suspense>
  if (view === 'audit-log' && role === 'ADMIN') return <Suspense><AuditLog /></Suspense>
  if (view === 'reset-data' && role === 'ADMIN') return <Suspense><ResetData /></Suspense>

  // Fallback - access denied
  toast.error('Anda tidak mempunyai akses ke skrin ini')
  return <Suspense>{role === 'STAFF' ? <DashboardStaff /> : role === 'HR' ? <TeamDashboard /> : <DashboardStaff />}</Suspense>
}
