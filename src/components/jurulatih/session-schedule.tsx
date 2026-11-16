'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, QrCode, ClipboardList, CalendarClock, Clock, MapPin, Video, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate, formatTime } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Session, Course, Lang, SessionMode } from '@/lib/types'

const PERIODS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Semua' },
  { value: 'past', label: 'Lampau' },
  { value: 'today', label: 'Hari Ini' },
  { value: 'upcoming', label: 'Akan Datang' },
]

export function SessionSchedule() {
  const { user, params, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const qc = useQueryClient()

  const [period, setPeriod] = React.useState('all')
  const [courseFilter, setCourseFilter] = React.useState<string>(params.courseId ? String(params.courseId) : 'all')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editSession, setEditSession] = React.useState<Session | null>(null)
  const [deleteSession, setDeleteSession] = React.useState<Session | null>(null)

  const { data: sesData, isLoading, isError } = useQuery({
    queryKey: ['sessions', period, courseFilter, user?.id],
    queryFn: () => api.sessions.list({ trainerId: user!.id, period, courseId: courseFilter === 'all' ? undefined : courseFilter }),
    enabled: !!user?.id,
  })
  const { data: courseData } = useQuery({
    queryKey: ['trainer-courses', user?.id],
    queryFn: () => api.courses.list({ instructorId: user!.id }),
    enabled: !!user?.id,
  })

  const createMut = useMutation({
    mutationFn: (data: any) => api.sessions.create(data),
    onSuccess: () => { toast.success('Sesi dicipta.'); qc.invalidateQueries({ queryKey: ['sessions'] }); setCreateOpen(false) },
    onError: (e: Error) => toast.error(e.message),
  })
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.sessions.update(id, data),
    onSuccess: () => { toast.success('Sesi dikemaskini.'); qc.invalidateQueries({ queryKey: ['sessions'] }); setEditSession(null) },
    onError: (e: Error) => toast.error(e.message),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.sessions.delete(id),
    onSuccess: () => { toast.success('Sesi dipadam.'); qc.invalidateQueries({ queryKey: ['sessions'] }); setDeleteSession(null) },
    onError: (e: Error) => toast.error(e.message),
  })

  const courses: Course[] = courseData?.courses || []
  const sessions: Session[] = sesData?.sessions || []

  if (isLoading) return <LoadingState label="Memuat sesi..." />
  if (isError) return <ErrorState message="Tidak dapat memuatkan sesi." />

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === 'ms' ? 'Jadual Sesi Latihan' : 'Training Session Schedule'}
        subtitle={lang === 'ms' ? 'Urus dan jadualkan sesi latihan.' : 'Manage and schedule training sessions.'}
        action={
          <Button className="gradient-primary text-white" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Cipta Sesi' : 'Create Session'}
          </Button>
        }
      />

      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              {PERIODS.map((p) => <TabsTrigger key={p.value} value={p.value}>{p.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Semua kursus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kursus</SelectItem>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={CalendarClock}
              title={lang === 'ms' ? 'Tiada sesi' : 'No sessions'}
              description={lang === 'ms' ? 'Cipta sesi latihan baru untuk jana QR kehadiran.' : 'Create a training session to generate attendance QR.'}
              action={<Button className="gradient-primary text-white" onClick={() => setCreateOpen(true)}><Plus className="size-4 mr-1" /> Cipta Sesi</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sesi</TableHead>
                  <TableHead>Tarikh & Masa</TableHead>
                  <TableHead>Mod</TableHead>
                  <TableHead>Kursus</TableHead>
                  <TableHead className="text-center">Daftar</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium max-w-xs truncate">{s.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 text-sm"><CalendarClock className="size-3.5 text-muted-foreground" />{formatDate(s.date, lang)}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" />{formatTime(s.startTime)} - {formatTime(s.endTime)}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{t(`session.${s.mode}`, lang)}</Badge></TableCell>
                    <TableCell className="text-xs">{s.course ? `${s.course.code} — ${s.course.title}` : '-'}</TableCell>
                    <TableCell className="text-center">{s._count?.attendances || 0}/{s.capacity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate('qr-display', { sessionId: s.id })} title="Skrin QR">
                          <QrCode className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => navigate('attendance-list', { sessionId: s.id })} title="Kehadiran">
                          <ClipboardList className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditSession(s)}><Pencil className="size-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteSession(s)}><Trash2 className="size-4 text-rose-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      {/* Create dialog */}
      <SessionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        lang={lang}
        courses={courses}
        trainerId={user?.id || ''}
        onSubmit={(data) => createMut.mutate(data)}
        submitting={createMut.isPending}
        defaultCourseId={params.courseId as string | undefined}
      />

      {/* Edit dialog */}
      <SessionDialog
        open={!!editSession}
        onOpenChange={(o) => !o && setEditSession(null)}
        lang={lang}
        courses={courses}
        trainerId={user?.id || ''}
        session={editSession}
        onSubmit={(data) => editSession && updateMut.mutate({ id: editSession.id, data })}
        submitting={updateMut.isPending}
      />

      {/* Delete */}
      <AlertDialog open={!!deleteSession} onOpenChange={(o) => !o && setDeleteSession(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam sesi?</AlertDialogTitle>
            <AlertDialogDescription>Sesi "{deleteSession?.title}" dan semua rekod kehadiran akan dipadam.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500" onClick={() => deleteSession && deleteMut.mutate(deleteSession.id)}>Padam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface SessionDialogProps {
  open: boolean
  onOpenChange: (b: boolean) => void
  lang: Lang
  courses: Course[]
  trainerId: string
  session?: Session | null
  onSubmit: (data: any) => void
  submitting: boolean
  defaultCourseId?: string
}

function SessionDialog({ open, onOpenChange, lang, courses, trainerId, session, onSubmit, submitting, defaultCourseId }: SessionDialogProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = React.useState<any>({
    title: '', courseId: defaultCourseId || '', date: today, startTime: '09:00', endTime: '12:00',
    mode: 'BERSEMUKA' as SessionMode, location: '', url: '', capacity: 40, lateAfterMin: 15,
  })

  React.useEffect(() => {
    if (session) {
      const d = new Date(session.date)
      const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
      setForm({
        title: session.title, courseId: session.courseId || '', date: `${yyyy}-${mm}-${dd}`,
        startTime: session.startTime, endTime: session.endTime, mode: session.mode,
        location: session.location || '', url: session.url || '', capacity: session.capacity,
        lateAfterMin: session.lateAfterMin,
      })
    } else {
      setForm({ title: '', courseId: defaultCourseId || '', date: today, startTime: '09:00', endTime: '12:00', mode: 'BERSEMUKA', location: '', url: '', capacity: 40, lateAfterMin: 15 })
    }
  }, [session, open])

  const submit = () => {
    if (!form.title || !form.date) { toast.error('Tajuk dan tarikh diperlukan.'); return }
    onSubmit({
      ...form,
      courseId: form.courseId || null,
      trainerId,
      capacity: Number(form.capacity),
      lateAfterMin: Number(form.lateAfterMin),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{session ? 'Sunting Sesi' : 'Cipta Sesi Latihan'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto scrollbar-thin pr-1">
          <div><Label>Tajuk Sesi</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <Label>Kursus (pilihan)</Label>
            <Select value={form.courseId || 'none'} onValueChange={(v) => setForm({ ...form, courseId: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="Tanpa kursus" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa kursus</SelectItem>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} — {c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Tarikh</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Mula</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
            <div><Label>Tamat</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
          </div>
          <div>
            <Label>Mod</Label>
            <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v as SessionMode })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BERSEMUKA">Bersemuka</SelectItem>
                <SelectItem value="DALAM_TALIAN">Dalam Talian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.mode === 'BERSEMUKA' ? (
            <div><Label>Lokasi</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Bilik Latihan 1" /></div>
          ) : (
            <div><Label>URL Mesyuarat</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://meet..." /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Kapasiti</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
            <div><Label>Lewat selepas (min)</Label><Input type="number" value={form.lateAfterMin} onChange={(e) => setForm({ ...form, lateAfterMin: e.target.value })} /></div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button className="gradient-primary text-white" disabled={submitting} onClick={submit}>
            {submitting ? 'Menyimpan...' : session ? 'Simpan' : 'Cipta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SessionSchedule
