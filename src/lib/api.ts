// Central API client - thin fetch wrappers used by all features (service layer abstraction)
// Per PRD: "lapisan akses data diabstrak (repository/service) supaya dummy DB boleh digantikan dengan API sebenar"

async function request<T = any>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    credentials: 'include',
  })
  if (!res.ok) {
    let msg = `Ralat ${res.status}`
    try {
      const body = await res.json()
      msg = body.error || body.message || msg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json() as Promise<T>
  return res.text() as unknown as Promise<T>
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request<{ user: any | null }>('/api/auth/me'),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    switchRole: (role: string) => request<{ user: any }>('/api/auth/switch', { method: 'POST', body: JSON.stringify({ role }) }),
  },
  courses: {
    list: (params?: Record<string, string | undefined>) => {
      const q = new URLSearchParams()
      if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v))
      return request<{ courses: any[] }>(`/api/courses?${q.toString()}`)
    },
    get: (id: string) => request<{ course: any }>(`/api/courses/${id}`),
    create: (data: any) => request<{ course: any }>('/api/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<{ course: any }>(`/api/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/courses/${id}`, { method: 'DELETE' }),
    modules: {
      create: (courseId: string, data: any) => request<{ module: any }>(`/api/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(data) }),
      update: (courseId: string, moduleId: string, data: any) => request<{ module: any }>(`/api/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (courseId: string, moduleId: string) => request(`/api/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' }),
      lessons: {
        create: (courseId: string, moduleId: string, data: any) => request<{ lesson: any }>(`/api/courses/${courseId}/modules/${moduleId}/lessons`, { method: 'POST', body: JSON.stringify(data) }),
        update: (courseId: string, moduleId: string, lessonId: string, data: any) => request<{ lesson: any }>(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (courseId: string, moduleId: string, lessonId: string) => request(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, { method: 'DELETE' }),
      },
    },
    quizzes: {
      create: (courseId: string, data: any) => request<{ quiz: any }>(`/api/courses/${courseId}/quizzes`, { method: 'POST', body: JSON.stringify(data) }),
      update: (courseId: string, quizId: string, data: any) => request<{ quiz: any }>(`/api/courses/${courseId}/quizzes/${quizId}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (courseId: string, quizId: string) => request(`/api/courses/${courseId}/quizzes/${quizId}`, { method: 'DELETE' }),
      questions: {
        create: (courseId: string, quizId: string, data: any) => request<{ question: any }>(`/api/courses/${courseId}/quizzes/${quizId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
        update: (courseId: string, quizId: string, qid: string, data: any) => request<{ question: any }>(`/api/courses/${courseId}/quizzes/${quizId}/questions/${qid}`, { method: 'PUT', body: JSON.stringify(data) }),
        delete: (courseId: string, quizId: string, qid: string) => request(`/api/courses/${courseId}/quizzes/${quizId}/questions/${qid}`, { method: 'DELETE' }),
      },
    },
  },
  enrollments: {
    list: (params: Record<string, string>) => {
      const q = new URLSearchParams(params)
      return request<{ enrollments: any[] }>(`/api/enrollments?${q.toString()}`)
    },
    update: (id: string, data: any) => request<{ enrollment: any }>(`/api/enrollments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    assign: (userId: string, courseId: string, dueDate?: string) =>
      request<{ enrollment: any }>('/api/enrollments', { method: 'POST', body: JSON.stringify({ userId, courseId, dueDate }) }),
  },
  lessons: {
    markProgress: (lessonId: string, completed: boolean, lastPosition?: string) =>
      request<{ progress: any }>(`/api/lessons/${lessonId}/progress`, { method: 'POST', body: JSON.stringify({ completed, lastPosition }) }),
  },
  quizzes: {
    submit: (quizId: string, answers: Record<string, string>) =>
      request<{ attempt: any; graded: any[]; score: number; passed: boolean }>(`/api/quizzes/${quizId}/attempt`, { method: 'POST', body: JSON.stringify({ answers }) }),
    attempts: (quizId: string) => request<{ attempts: any[] }>(`/api/quizzes/${quizId}/attempt`),
  },
  sessions: {
    list: (params?: Record<string, string | undefined>) => {
      const q = new URLSearchParams()
      if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v))
      return request<{ sessions: any[] }>(`/api/sessions?${q.toString()}`)
    },
    get: (id: string) => request<{ session: any }>(`/api/sessions/${id}`),
    create: (data: any) => request<{ session: any }>('/api/sessions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<{ session: any }>(`/api/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/sessions/${id}`, { method: 'DELETE' }),
    checkIn: (id: string, payload: { qrToken?: string; code6?: string }) =>
      request<{ attendance: any; late: boolean }>(`/api/sessions/${id}/check-in`, { method: 'POST', body: JSON.stringify(payload) }),
    bulk: (id: string, records: any[]) =>
      request<{ count: number; attendances: any[] }>(`/api/sessions/${id}/bulk`, { method: 'POST', body: JSON.stringify({ records }) }),
    importCsv: (id: string, rows: any[], commit = false) =>
      request<{ total: number; valid: number; errors: number; errorList: any[]; preview: any[]; committed: boolean }>(`/api/sessions/${id}/import`, { method: 'POST', body: JSON.stringify({ rows, commit }) }),
    exportUrl: (id: string, format: 'csv' | 'pdf') => `/api/sessions/${id}/export?format=${format}`,
    regenerateCode: (id: string) => request<{ session: any }>(`/api/sessions/${id}/regenerate-code`, { method: 'POST' }),
  },
  attendance: {
    list: (params: Record<string, string>) => {
      const q = new URLSearchParams(params)
      return request<{ attendances: any[] }>(`/api/attendance?${q.toString()}`)
    },
    listCorrections: (state = 'PENDING') =>
      request<{ corrections: any[] }>(`/api/attendance/corrections?state=${state}`),
    requestCorrection: (attendanceId: string, newStatus: string, reason: string) =>
      request<{ correction: any }>(`/api/attendance/${attendanceId}/correction`, { method: 'POST', body: JSON.stringify({ newStatus, reason }) }),
    reviewCorrection: (attendanceId: string, state: 'APPROVED' | 'REJECTED') =>
      request<{ correction: any }>(`/api/attendance/${attendanceId}/correction`, { method: 'PUT', body: JSON.stringify({ state }) }),
  },
  certificates: {
    list: (userId?: string) => request<{ certificates: any[] }>(`/api/certificates?${userId ? `userId=${userId}` : ''}`),
    verify: (certNo?: string, verifyCode?: string) => {
      const q = new URLSearchParams()
      if (certNo) q.set('certNo', certNo)
      if (verifyCode) q.set('verifyCode', verifyCode)
      return request<{ valid: boolean; certificate?: any }>(`/api/certificates/verify?${q.toString()}`)
    },
  },
  reports: {
    completion: () => request<any>('/api/reports/completion'),
    attendance: (groupBy: string) => request<any>(`/api/reports/attendance?groupBy=${groupBy}`),
    quiz: () => request<any>('/api/reports/quiz'),
  },
  departments: {
    list: () => request<{ departments: any[] }>('/api/departments'),
    create: (data: any) => request<{ department: any }>('/api/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<{ department: any }>(`/api/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/departments/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => request<{ categories: any[] }>('/api/categories'),
    create: (data: any) => request<{ category: any }>('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<{ category: any }>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/categories/${id}`, { method: 'DELETE' }),
  },
  users: {
    list: (params?: Record<string, string | undefined>) => {
      const q = new URLSearchParams()
      if (params) Object.entries(params).forEach(([k, v]) => v && q.set(k, v))
      return request<{ users: any[] }>(`/api/users?${q.toString()}`)
    },
    update: (id: string, data: any) => request<{ user: any }>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    create: (data: any) => request<{ user: any }>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    deactivate: (id: string) => request(`/api/users/${id}`, { method: 'DELETE' }),
  },
  audit: {
    list: (limit = 100) => request<{ logs: any[] }>(`/api/audit?limit=${limit}`),
  },
  notifications: {
    list: () => request<{ notifications: any[] }>('/api/notifications'),
    markAllRead: () => request('/api/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) }),
    markRead: (id: string, read: boolean) => request('/api/notifications', { method: 'PUT', body: JSON.stringify({ id, read }) }),
  },
  admin: {
    reset: () => request<{ ok: boolean; message: string }>('/api/admin/reset', { method: 'POST' }),
  },
}
