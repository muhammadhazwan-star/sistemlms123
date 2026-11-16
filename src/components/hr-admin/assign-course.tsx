'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen, Users, CheckCircle2, ArrowRight, ArrowLeft, Search, Send, BarChart3, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, statusColor } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Lang, Course, User, Department } from '@/lib/types'

export function AssignCourse() {
  const { user, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()

  const [step, setStep] = React.useState<1 | 2>(1)
  const [courseId, setCourseId] = React.useState('')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [deptFilter, setDeptFilter] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [dueDate, setDueDate] = React.useState<Date | undefined>(undefined)
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null)

  const { data: coursesData, isLoading: cL, isError: cE } = useQuery({
    queryKey: ['courses', 'published'],
    queryFn: () => api.courses.list({ status: 'PUBLISHED' }),
  })
  const { data: usersData, isLoading: uL, isError: uE } = useQuery({
    queryKey: ['users', 'staff', deptFilter],
    queryFn: () => api.users.list({ role: 'STAFF', departmentId: deptFilter === 'all' ? undefined : deptFilter }),
  })
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.departments.list(),
  })
  const { data: enrData } = useQuery({
    queryKey: ['enrollments', 'byCourse', courseId],
    queryFn: () => api.enrollments.list({ courseId }),
    enabled: !!courseId,
  })

  const courses: Course[] = coursesData?.courses || []
  const users: (User & { department?: Department })[] = usersData?.users || []
  const departments: Department[] = deptData?.departments || []
  const enrolled: any[] = enrData?.enrollments || []

  const filteredUsers = React.useMemo(() => {
    if (!search.trim()) return users
    const q = search.toLowerCase()
    return users.filter(u => u.name.toLowerCase().includes(q) || u.staffNo.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }, [users, search])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const assignMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected)
      setProgress({ done: 0, total: ids.length })
      let done = 0
      for (const id of ids) {
        await api.enrollments.assign(id, courseId, dueDate ? dueDate.toISOString() : undefined)
        done++
        setProgress({ done, total: ids.length })
      }
    },
    onSuccess: () => {
      toast.success(lang === 'ms' ? `Kursus ditugaskan kepada ${selected.size} pengguna` : `Course assigned to ${selected.size} users`)
      setSelected(new Set())
      setStep(1)
      setProgress(null)
      qc.invalidateQueries({ queryKey: ['enrollments', 'byCourse', courseId] })
    },
    onError: (e: any) => {
      toast.error(e?.message || 'Ralat menugaskan kursus')
      setProgress(null)
    },
  })

  if (cL || uL) return <LoadingState label="Memuat..." />
  if (cE || uE) return <ErrorState message="Tidak dapat memuatkan data." />

  const selectedCourse = courses.find(c => c.id === courseId)

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Tugaskan Kursus' : 'Assign Course'}
        subtitle={lang === 'ms' ? 'Tugaskan kursus kepada staf secara pukal.' : 'Bulk-assign a course to staff.'}
        action={
          <Button variant="outline" onClick={() => navigate('reports')}>
            <BarChart3 className="size-4 mr-1" /> {lang === 'ms' ? 'Lihat Laporan Penyiapan' : 'View Completion Report'}
          </Button>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-sm">
        <div className={`flex items-center gap-2 ${step === 1 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
          <span className={`size-6 rounded-full flex items-center justify-center text-xs ${step === 1 ? 'gradient-primary text-white' : 'bg-muted'}`}>1</span>
          {lang === 'ms' ? 'Pilih Kursus & Staf' : 'Select Course & Staff'}
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${step === 2 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
          <span className={`size-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'gradient-primary text-white' : 'bg-muted'}`}>2</span>
          {lang === 'ms' ? 'Sahkan & Tugaskan' : 'Confirm & Assign'}
        </div>
      </div>

      {step === 1 && (
        <GlassCard className="p-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">{lang === 'ms' ? 'Kursus' : 'Course'}</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder={lang === 'ms' ? 'Pilih kursus...' : 'Select course...'} /></SelectTrigger>
                <SelectContent>
                  {courses.length === 0 && <SelectItem value="none" disabled>{lang === 'ms' ? 'Tiada kursus diterbitkan' : 'No published courses'}</SelectItem>}
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{lang === 'ms' ? 'Tarikh Akhir (pilihan)' : 'Due Date (optional)'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {dueDate ? formatDate(dueDate, lang) : (lang === 'ms' ? 'Tanpa tarikh akhir' : 'No due date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); setSelected(new Set()) }}>
              <SelectTrigger className="w-48"><SelectValue placeholder={lang === 'ms' ? 'Semua jabatan' : 'All departments'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'ms' ? 'Semua Jabatan' : 'All Departments'}</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.code} — {d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-48">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'ms' ? 'Cari nama / no staf / emel...' : 'Search name / staff no / email...'} className="pl-9" />
            </div>
            <span className="text-xs text-muted-foreground ml-auto">{selected.size} {lang === 'ms' ? 'dipilih' : 'selected'} / {filteredUsers.length}</span>
          </div>

          <div className="rounded-xl border border-border/60 max-h-80 overflow-y-auto scrollbar-thin">
            {filteredUsers.length === 0 ? (
              <div className="p-6"><EmptyState icon={Users} title={lang === 'ms' ? 'Tiada staf dijumpai' : 'No staff found'} /></div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map(u => {
                  const isEnrolled = enrolled.some(e => e.userId === u.id)
                  return (
                    <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-accent/40 cursor-pointer">
                      <Checkbox checked={selected.has(u.id)} onCheckedChange={() => toggle(u.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.staffNo} · {u.email}</div>
                      </div>
                      {u.department && <Badge variant="outline" className="text-[10px]">{u.department.code}</Badge>}
                      {isEnrolled && <Badge variant="secondary" className="text-[10px]">{lang === 'ms' ? 'Telah didaftarkan' : 'Already enrolled'}</Badge>}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button disabled={!courseId || selected.size === 0} onClick={() => setStep(2)}>
              {lang === 'ms' ? 'Seterusnya' : 'Next'} <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </GlassCard>
      )}

      {step === 2 && (
        <GlassCard className="p-5 space-y-4">
          <div className="rounded-xl bg-accent/40 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ms' ? 'Kursus' : 'Course'}</div>
            <div className="font-semibold">{selectedCourse?.code} — {selectedCourse?.title}</div>
            {dueDate && <div className="text-sm text-muted-foreground mt-1">{lang === 'ms' ? 'Tarikh akhir:' : 'Due:'} {formatDate(dueDate, lang)}</div>}
          </div>
          <div className="text-sm">
            <div className="font-medium mb-2">{lang === 'ms' ? `${selected.size} staf akan ditugaskan:` : `${selected.size} staff will be assigned:`}</div>
            <div className="rounded-xl border border-border/60 max-h-60 overflow-y-auto scrollbar-thin">
              <div className="divide-y">
                {Array.from(selected).map(id => {
                  const u = users.find(x => x.id === id)
                  if (!u) return null
                  return (
                    <div key={id} className="flex items-center gap-3 p-3">
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.staffNo} · {u.department?.code || '-'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {progress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{lang === 'ms' ? `Menugaskan... ${progress.done}/${progress.total}` : `Assigning... ${progress.done}/${progress.total}`}</span>
                <Loader2 className="size-4 animate-spin text-primary" />
              </div>
              <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setStep(1)} disabled={!!progress}>
              <ArrowLeft className="size-4 mr-1" /> {lang === 'ms' ? 'Kembali' : 'Back'}
            </Button>
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending || !!progress}>
              <Send className="size-4 mr-1" /> {lang === 'ms' ? 'Tugaskan Sekarang' : 'Assign Now'}
            </Button>
          </div>
        </GlassCard>
      )}

      {courseId && enrolled.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="size-5 text-primary" />
            <h2 className="font-semibold text-lg">{lang === 'ms' ? 'Pendaftaran Semasa' : 'Current Enrollments'}</h2>
          </div>
          <div className="rounded-xl border border-border/60 max-h-80 overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('label.staffNo', lang)}</TableHead>
                  <TableHead>{t('label.name', lang)}</TableHead>
                  <TableHead>{t('label.department', lang)}</TableHead>
                  <TableHead>{t('label.status', lang)}</TableHead>
                  <TableHead>{t('label.progress', lang)}</TableHead>
                  <TableHead>{lang === 'ms' ? 'Tamat' : 'Due'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolled.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.user?.staffNo}</TableCell>
                    <TableCell className="font-medium">{e.user?.name}</TableCell>
                    <TableCell className="text-xs">{e.user?.department?.code || '-'}</TableCell>
                    <TableCell><Badge className={statusColor(e.status)}>{t(`enr.${e.status}`, lang)}</Badge></TableCell>
                    <TableCell><Progress value={e.progressPct || 0} className="h-2 w-20" /></TableCell>
                    <TableCell className="text-xs">{e.dueDate ? formatDate(e.dueDate, lang) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

export default AssignCourse
