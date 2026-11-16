'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Users, Layers, CalendarClock, Plus, Pencil, CalendarPlus, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { statusColor } from '@/lib/format'
import { PageHeader, StatCard, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Course, Lang, CourseLevel, CourseStatus } from '@/lib/types'

export function TrainerCourses() {
  const { user, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trainer-courses', user?.id],
    queryFn: () => api.courses.list({ instructorId: user!.id }),
    enabled: !!user?.id,
  })
  const { data: upcomingData } = useQuery({
    queryKey: ['sessions', 'upcoming', user?.id],
    queryFn: () => api.sessions.list({ trainerId: user!.id, period: 'upcoming' }),
    enabled: !!user?.id,
  })
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => api.categories.list() })

  const [createOpen, setCreateOpen] = React.useState(false)

  const createMut = useMutation({
    mutationFn: (data: any) => api.courses.create(data),
    onSuccess: () => {
      toast.success('Kursus berjaya dicipta.')
      qc.invalidateQueries({ queryKey: ['trainer-courses'] })
      setCreateOpen(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <LoadingState label="Memuat senarai kursus..." />
  if (isError) return <ErrorState message="Tidak dapat memuatkan kursus." />

  const courses: Course[] = data?.courses || []
  const cats = catData?.categories || []
  const upcomingCount = (upcomingData?.sessions || []).length
  const totalStudents = courses.reduce((a, c) => a + (c._count?.enrollments || 0), 0)
  const totalModules = courses.reduce((a, c) => a + (c.modules?.length || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Kursus Saya (Jurulatih)' : 'My Courses (Trainer)'}
        subtitle={lang === 'ms' ? 'Urus dan susun kursus yang anda ajar.' : 'Manage and arrange courses you teach.'}
        action={
          <Button className="gradient-primary text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Cipta Kursus Baru' : 'Create Course'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={lang === 'ms' ? 'Jumlah Kursus' : 'Total Courses'} value={courses.length} icon={BookOpen} accent="primary" />
        <StatCard label={lang === 'ms' ? 'Pelajar Aktif' : 'Active Students'} value={totalStudents} icon={Users} accent="emerald" />
        <StatCard label={lang === 'ms' ? 'Modul' : 'Modules'} value={totalModules} icon={Layers} accent="amber" />
        <StatCard label={lang === 'ms' ? 'Sesi Akan Datang' : 'Upcoming Sessions'} value={upcomingCount} icon={CalendarClock} accent="sky" />
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={BookOpen}
              title={lang === 'ms' ? 'Tiada kursus lagi' : 'No courses yet'}
              description={lang === 'ms' ? 'Cipta kursus pertama anda untuk mula mengajar.' : 'Create your first course to start teaching.'}
              action={<Button className="gradient-primary text-white" onClick={() => setCreateOpen(true)}><Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Cipta Kursus' : 'Create Course'}</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Tajuk</TableHead>
                  <TableHead>Tahap</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Pelajar</TableHead>
                  <TableHead className="text-center">Modul</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="outline" className="font-mono text-[10px]">{c.code}</Badge></TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{c.title}</TableCell>
                    <TableCell><Badge variant="secondary">{t(`level.${c.level}`, lang)}</Badge></TableCell>
                    <TableCell><Badge className={statusColor(c.status)}>{t(`course.${c.status.toLowerCase()}`, lang)}</Badge></TableCell>
                    <TableCell className="text-center">{c._count?.enrollments || 0}</TableCell>
                    <TableCell className="text-center">{c.modules?.length || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate('course-detail', { courseId: c.id })}>
                          <Eye className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate('course-editor', { courseId: c.id })}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate('session-schedule', { courseId: c.id })}>
                          <CalendarPlus className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      <CreateCourseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        lang={lang}
        categories={cats}
        instructorId={user?.id || ''}
        onSubmit={(data) => createMut.mutate(data)}
        submitting={createMut.isPending}
      />
    </div>
  )
}

interface CreateCourseDialogProps {
  open: boolean
  onOpenChange: (b: boolean) => void
  lang: Lang
  categories: any[]
  instructorId: string
  onSubmit: (data: any) => void
  submitting: boolean
}

function CreateCourseDialog({ open, onOpenChange, lang, categories, instructorId, onSubmit, submitting }: CreateCourseDialogProps) {
  const [form, setForm] = React.useState({
    code: '', title: '', description: '', level: 'PEMULA' as CourseLevel,
    language: 'ms', durationHours: 4, categoryId: '', status: 'DRAFT' as CourseStatus,
  })
  React.useEffect(() => {
    if (!open) {
      setForm({ code: '', title: '', description: '', level: 'PEMULA', language: 'ms', durationHours: 4, categoryId: '', status: 'DRAFT' })
    }
  }, [open])

  const submit = () => {
    if (!form.code || !form.title) {
      toast.error('Kod dan tajuk diperlukan.')
      return
    }
    onSubmit({
      ...form,
      instructorId,
      outcomes: [],
      syllabus: [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lang === 'ms' ? 'Cipta Kursus Baru' : 'Create New Course'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kod Kursus</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="AI-101" />
            </div>
            <div>
              <Label>Tahap</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as CourseLevel })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['PEMULA', 'PERTENGAHAN', 'LANJUTAN', 'SEMUA'] as CourseLevel[]).map((l) => (
                    <SelectItem key={l} value={l}>{t(`level.${l}`, lang)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tajuk</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Pengenalan Kecerdasan Buatan" />
          </div>
          <div>
            <Label>Penerangan</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bahasa</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tempoh (jam)</Label>
              <Input type="number" min={1} value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kategori</Label>
              <Select value={form.categoryId || 'none'} onValueChange={(v) => setForm({ ...form, categoryId: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Tanpa kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa kategori</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CourseStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draf</SelectItem>
                  <SelectItem value="PUBLISHED">Diterbitkan</SelectItem>
                  <SelectItem value="ARCHIVED">Diarkibkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">{t('action.cancel', lang)}</Button></DialogClose>
          <Button className="gradient-primary text-white" disabled={submitting} onClick={submit}>
            {submitting ? 'Menyimpan...' : t('action.create', lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TrainerCourses
