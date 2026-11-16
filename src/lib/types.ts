// Shared types matching Prisma models (for client-side use)
export type Role = 'ADMIN' | 'HR' | 'TRAINER' | 'STAFF'
export type CourseLevel = 'PEMULA' | 'PERTENGAHAN' | 'LANJUTAN' | 'SEMUA'
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type LessonType = 'TEXT' | 'VIDEO' | 'PDF' | 'LAB'
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'
export type EnrollmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED'
export type SessionMode = 'BERSEMUKA' | 'DALAM_TALIAN'
export type AttendanceStatus = 'HADIR' | 'LEWAT' | 'TIDAK_HADIR' | 'CUTI' | 'DIKECUALIKAN'
export type AttendanceMethod = 'QR' | 'CODE' | 'MANUAL' | 'IMPORT' | 'AUTO'
export type CorrectionState = 'PENDING' | 'APPROVED' | 'REJECTED'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface User {
  id: string
  staffNo: string
  name: string
  email: string
  role: Role
  departmentId?: string | null
  position?: string | null
  language: string
  avatarColor: string
  department?: { id: string; code: string; name: string } | null
}

export interface Department { id: string; code: string; name: string; headUserId?: string | null; head?: User | null }
export interface Category { id: string; name: string; description?: string | null; _count?: { courses: number } }

export interface Lesson {
  id: string; moduleId: string; title: string; type: LessonType
  content: string; durationMin: number; order: number
}
export interface Module { id: string; courseId: string; title: string; order: number; lessons: Lesson[] }
export interface Question {
  id: string; quizId: string; type: QuestionType; text: string
  options: string[]; correctAnswer: string; explanation?: string | null; points: number; order: number
}
export interface Quiz {
  id: string; courseId: string; title: string; timeLimitMin: number
  maxAttempts: number; passMark: number; questions: Question[]
}
export interface Course {
  id: string; code: string; title: string; description: string
  categoryId?: string | null; level: CourseLevel; language: string
  durationHours: number; instructorId?: string | null
  status: CourseStatus; passMark: number; minAttendancePct: number
  thumbnail?: string | null
  outcomes: string; syllabus: string
  category?: Category | null
  instructor?: User | null
  modules: Module[]
  quizzes?: Quiz[]
  enrollments?: Enrollment[]
  sessions?: Session[]
  _count?: { enrollments: number }
}

export interface Enrollment {
  id: string; userId: string; courseId: string; assignedBy?: string | null
  status: EnrollmentStatus; progressPct: number; dueDate?: string | null
  completedAt?: string | null; createdAt: string; updatedAt: string
  course?: Course; user?: User; assigner?: User | null
}

export interface Session {
  id: string; courseId?: string | null; title: string; date: string
  startTime: string; endTime: string; mode: SessionMode
  location?: string | null; url?: string | null; capacity: number
  qrToken: string; code6: string; codeExpiry: string; lateAfterMin: number
  trainerId?: string | null
  course?: Course | null; trainer?: User | null
  attendances?: Attendance[]
  _count?: { attendances: number }
}

export interface Attendance {
  id: string; sessionId: string; userId: string
  status: AttendanceStatus; checkInAt?: string | null; checkOutAt?: string | null
  method: AttendanceMethod; recordedById?: string | null; remarks?: string | null
  user?: User; session?: Session; recorder?: User | null
}

export interface AttendanceCorrection {
  id: string; attendanceId: string; requestedById: string
  oldStatus: AttendanceStatus; newStatus: AttendanceStatus
  reason: string; approvedById?: string | null; state: CorrectionState
  attendance?: Attendance; requester?: User; approver?: User | null
}

export interface Certificate {
  id: string; userId: string; courseId: string; certNo: string
  issuedAt: string; expiresAt?: string | null; verifyCode: string
  course?: Course; user?: User
}

export interface Notification {
  id: string; userId: string; type: string; message: string
  read: boolean; createdAt: string
}

export interface AuditLog {
  id: string; userId?: string | null; action: string; entity: string
  entityId?: string | null; before?: string | null; after?: string | null
  timestamp: string; user?: User | null
}
