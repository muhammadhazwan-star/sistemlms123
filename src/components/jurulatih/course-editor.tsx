'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Pencil, Trash2, Save, BookText, Layers, GraduationCap, ChevronDown, ChevronRight, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { PageHeader, GlassCard, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import type { Course, Module, Lesson, Quiz, Question, Lang, CourseLevel, CourseStatus, LessonType, QuestionType } from '@/lib/types'

export function CourseEditor() {
  const { user, params, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const courseId = params.courseId as string
  const qc = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.courses.get(courseId),
    enabled: !!courseId,
  })

  if (!courseId) return <ErrorState message="ID kursus tiada." />
  if (isLoading) return <LoadingState label="Memuat penyunting kursus..." />
  if (isError || !data?.course) return <ErrorState message="Tidak dapat memuatkan kursus." />

  const course: Course = data.course

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        subtitle={`${course.code} · ${t(`level.${course.level}`, lang)}`}
        action={
          <Button variant="outline" onClick={() => navigate('trainer-courses')}>
            <ArrowLeft className="size-4 mr-1" /> {t('action.back', lang)}
          </Button>
        }
      />

      <Tabs defaultValue="meta">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="meta"><BookText className="size-4 mr-1.5" /> {lang === 'ms' ? 'Maklumat Kursus' : 'Course Info'}</TabsTrigger>
          <TabsTrigger value="modules"><Layers className="size-4 mr-1.5" /> Modul</TabsTrigger>
          <TabsTrigger value="quizzes"><GraduationCap className="size-4 mr-1.5" /> Kuiz</TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="mt-4">
          <MetaEditor course={course} lang={lang} onSaved={() => qc.invalidateQueries({ queryKey: ['course', courseId] })} />
        </TabsContent>
        <TabsContent value="modules" className="mt-4">
          <ModulesEditor course={course} lang={lang} onChanged={() => qc.invalidateQueries({ queryKey: ['course', courseId] })} />
        </TabsContent>
        <TabsContent value="quizzes" className="mt-4">
          <QuizzesEditor course={course} lang={lang} onChanged={() => qc.invalidateQueries({ queryKey: ['course', courseId] })} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------- Meta Editor ----------------
function MetaEditor({ course, lang, onSaved }: { course: Course; lang: Lang; onSaved: () => void }) {
  const [form, setForm] = React.useState({
    title: course.title,
    description: course.description || '',
    level: course.level,
    language: course.language || 'ms',
    durationHours: course.durationHours,
    passMark: course.passMark,
    minAttendancePct: course.minAttendancePct || 0,
    status: course.status,
    outcomes: (course.outcomes || '').split('\n').filter(Boolean),
    syllabus: (course.syllabus || '').split('\n').filter(Boolean),
  })

  const saveMut = useMutation({
    mutationFn: (data: any) => api.courses.update(course.id, data),
    onSuccess: () => { toast.success('Maklumat kursus disimpan.'); onSaved() },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <GlassCard className="p-6 space-y-4 max-w-3xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Tajuk Kursus</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Label>Penerangan</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <Label>Tahap</Label>
          <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as CourseLevel })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['PEMULA', 'PERTENGAHAN', 'LANJUTAN', 'SEMUA'] as CourseLevel[]).map((l) => <SelectItem key={l} value={l}>{t(`level.${l}`, lang)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
        <div>
          <Label>Markah Lulus (%)</Label>
          <Input type="number" min={0} max={100} value={form.passMark} onChange={(e) => setForm({ ...form, passMark: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Kehadiran Min. (%)</Label>
          <Input type="number" min={0} max={100} value={form.minAttendancePct} onChange={(e) => setForm({ ...form, minAttendancePct: Number(e.target.value) })} />
        </div>
      </div>

      <Separator />

      <div>
        <Label>Hasil Pembelajaran (satu per baris)</Label>
        <Textarea rows={5} value={form.outcomes.join('\n')} onChange={(e) => setForm({ ...form, outcomes: e.target.value.split('\n').filter(Boolean) })} placeholder="Memahami konsep asas AI&#10;Mengaplikasi AI dalam kerja harian" />
      </div>
      <div>
        <Label>Silabus (satu per baris)</Label>
        <Textarea rows={5} value={form.syllabus.join('\n')} onChange={(e) => setForm({ ...form, syllabus: e.target.value.split('\n').filter(Boolean) })} placeholder="Modul 1: Pengenalan&#10;Modul 2: Aplikasi" />
      </div>

      <div className="flex justify-end">
        <Button className="gradient-primary text-white" disabled={saveMut.isPending} onClick={() => saveMut.mutate(form)}>
          <Save className="size-4 mr-1" /> {saveMut.isPending ? 'Menyimpan...' : t('action.save', lang)}
        </Button>
      </div>
    </GlassCard>
  )
}

// ---------------- Modules Editor ----------------
function ModulesEditor({ course, lang, onChanged }: { course: Course; lang: Lang; onChanged: () => void }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = React.useState<string | null>(course.modules?.[0]?.id || null)
  const [editModule, setEditModule] = React.useState<Module | null>(null)
  const [editLesson, setEditLesson] = React.useState<{ module: Module; lesson?: Lesson } | null>(null)
  const [deleteModule, setDeleteModule] = React.useState<Module | null>(null)
  const [deleteLesson, setDeleteLesson] = React.useState<{ moduleId: string; lesson: Lesson } | null>(null)

  const modules: Module[] = course.modules || []

  const createModMut = useMutation({
    mutationFn: () => api.courses.modules.create(course.id, { title: 'Modul Baru' }),
    onSuccess: () => { toast.success('Modul ditambah.'); onChanged() },
    onError: (e: Error) => toast.error(e.message),
  })
  const updateModMut = useMutation({
    mutationFn: (m: Module) => api.courses.modules.update(course.id, m.id, { title: m.title, order: m.order }),
    onSuccess: () => { toast.success('Modul dikemaskini.'); onChanged(); setEditModule(null) },
    onError: (e: Error) => toast.error(e.message),
  })
  const deleteModMut = useMutation({
    mutationFn: (m: Module) => api.courses.modules.delete(course.id, m.id),
    onSuccess: () => { toast.success('Modul dipadam.'); onChanged(); setDeleteModule(null) },
    onError: (e: Error) => toast.error(e.message),
  })
  const saveLessonMut = useMutation({
    mutationFn: ({ module, lesson }: { module: Module; lesson: Partial<Lesson> }) =>
      lesson.id
        ? api.courses.modules.lessons.update(course.id, module.id, lesson.id, lesson)
        : api.courses.modules.lessons.create(course.id, module.id, lesson),
    onSuccess: () => { toast.success('Pelajaran disimpan.'); onChanged(); setEditLesson(null) },
    onError: (e: Error) => toast.error(e.message),
  })
  const deleteLessonMut = useMutation({
    mutationFn: ({ moduleId, lesson }: { moduleId: string; lesson: Lesson }) =>
      api.courses.modules.lessons.delete(course.id, moduleId, lesson.id),
    onSuccess: () => { toast.success('Pelajaran dipadam.'); onChanged(); setDeleteLesson(null) },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Modul & Pelajaran</h3>
        <Button className="gradient-primary text-white" size="sm" onClick={() => createModMut.mutate()}>
          <Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Modul Baru' : 'New Module'}
        </Button>
      </div>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{lang === 'ms' ? 'Belum ada modul. Klik "Modul Baru" untuk mula.' : 'No modules yet.'}</p>
      ) : (
        <div className="space-y-2">
          {modules.map((m, idx) => (
            <div key={m.id} className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <button className="flex items-center gap-2 flex-1 min-w-0 text-left" onClick={() => setExpanded(expanded === m.id ? null : m.id)}>
                  {expanded === m.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                  <span className="font-medium truncate">{m.title}</span>
                  <Badge variant="secondary" className="text-[10px]">{m.lessons?.length || 0} pelajaran</Badge>
                </button>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditModule(m)}><Pencil className="size-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteModule(m)}><Trash2 className="size-4 text-rose-500" /></Button>
                </div>
              </div>
              {expanded === m.id && (
                <div className="border-t border-border/60 p-3 space-y-2 bg-muted/20">
                  {(m.lessons || []).length === 0 && <p className="text-xs text-muted-foreground py-2 text-center">Tiada pelajaran.</p>}
                  {(m.lessons || []).map((l, li) => (
                    <div key={l.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/60 p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[10px]">{li + 1}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{l.type}</Badge>
                        <span className="font-medium truncate text-sm">{l.title}</span>
                        <span className="text-xs text-muted-foreground">{l.durationMin}m</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditLesson({ module: m, lesson: l })}><Pencil className="size-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteLesson({ moduleId: m.id, lesson: l })}><Trash2 className="size-3.5 text-rose-500" /></Button>
                      </div>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setEditLesson({ module: m })}>
                    <Plus className="size-3.5 mr-1" /> {lang === 'ms' ? 'Tambah Pelajaran' : 'Add Lesson'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Module dialog */}
      <Dialog open={!!editModule} onOpenChange={(o) => !o && setEditModule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sunting Modul</DialogTitle></DialogHeader>
          {editModule && (
            <div className="space-y-3 py-2">
              <div>
                <Label>Tajuk Modul</Label>
                <Input value={editModule.title} onChange={(e) => setEditModule({ ...editModule, title: e.target.value })} />
              </div>
              <div>
                <Label>Urutan</Label>
                <Input type="number" value={editModule.order} onChange={(e) => setEditModule({ ...editModule, order: Number(e.target.value) })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
            <Button className="gradient-primary text-white" onClick={() => editModule && updateModMut.mutate(editModule)}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson dialog */}
      <LessonEditorDialog
        state={editLesson}
        onClose={() => setEditLesson(null)}
        onSave={(lesson) => editLesson && saveLessonMut.mutate({ module: editLesson.module, lesson })}
        lang={lang}
      />

      {/* Delete module */}
      <AlertDialog open={!!deleteModule} onOpenChange={(o) => !o && setDeleteModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam modul?</AlertDialogTitle>
            <AlertDialogDescription>Modul "{deleteModule?.title}" dan semua pelajarannya akan dipadam.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500" onClick={() => deleteModule && deleteModMut.mutate(deleteModule)}>Padam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete lesson */}
      <AlertDialog open={!!deleteLesson} onOpenChange={(o) => !o && setDeleteLesson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam pelajaran?</AlertDialogTitle>
            <AlertDialogDescription>Pelajaran "{deleteLesson?.lesson.title}" akan dipadam.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500" onClick={() => deleteLesson && deleteLessonMut.mutate(deleteLesson)}>Padam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  )
}

function LessonEditorDialog({
  state, onClose, onSave, lang,
}: {
  state: { module: Module; lesson?: Lesson } | null
  onClose: () => void
  onSave: (lesson: Partial<Lesson>) => void
  lang: Lang
}) {
  const [form, setForm] = React.useState<Partial<Lesson>>({})
  React.useEffect(() => {
    if (state?.lesson) setForm({ ...state.lesson })
    else if (state) setForm({ title: '', type: 'TEXT', content: '', durationMin: 15, order: (state.module.lessons?.length || 0) + 1 })
  }, [state])

  if (!state) return null
  const isLab = form.type === 'LAB'

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{state.lesson ? 'Sunting Pelajaran' : 'Tambah Pelajaran'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
          <div>
            <Label>Tajuk</Label>
            <Input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label>Jenis</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as LessonType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Teks</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="LAB">Lab Interaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tempoh (min)</Label>
              <Input type="number" value={form.durationMin ?? 15} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label>
              {form.type === 'TEXT' ? 'Kandungan (Markdown)' : form.type === 'VIDEO' ? 'URL Video' : form.type === 'PDF' ? 'URL PDF' : 'JSON Senario Lab'}
            </Label>
            <Textarea
              rows={6}
              value={form.content || ''}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={form.type === 'VIDEO' ? 'https://...' : form.type === 'PDF' ? 'https://...pdf' : isLab ? '{"prompt":"...","scenario":"..."}' : '# Tajuk\n\nKandungan...'}
              className="font-mono text-xs"
            />
            {isLab && <p className="text-xs text-muted-foreground mt-1">Format JSON: <code>{`{"prompt":"Arahan","scenario":"Senario"}`}</code></p>}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button className="gradient-primary text-white" onClick={() => onSave(form)}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- Quizzes Editor ----------------
function QuizzesEditor({ course, lang, onChanged }: { course: Course; lang: Lang; onChanged: () => void }) {
  const [editQuiz, setEditQuiz] = React.useState<Quiz | null>(null)
  const [deleteQuiz, setDeleteQuiz] = React.useState<Quiz | null>(null)

  const quizzes: Quiz[] = course.quizzes || []

  const createMut = useMutation({
    mutationFn: () => api.courses.quizzes.create(course.id, { title: 'Kuiz Baru', timeLimitMin: 20, maxAttempts: 3, passMark: 70 }),
    onSuccess: () => { toast.success('Kuiz dicipta.'); onChanged() },
    onError: (e: Error) => toast.error(e.message),
  })
  const updateMut = useMutation({
    mutationFn: (q: Quiz) => api.courses.quizzes.update(course.id, q.id, { title: q.title, timeLimitMin: q.timeLimitMin, maxAttempts: q.maxAttempts, passMark: q.passMark }),
    onSuccess: () => { toast.success('Kuiz dikemaskini.'); onChanged(); setEditQuiz(null) },
    onError: (e: Error) => toast.error(e.message),
  })
  const deleteMut = useMutation({
    mutationFn: (q: Quiz) => api.courses.quizzes.delete(course.id, q.id),
    onSuccess: () => { toast.success('Kuiz dipadam.'); onChanged(); setDeleteQuiz(null) },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2"><GraduationCap className="size-5" /> Kuiz</h3>
          <Button className="gradient-primary text-white" size="sm" onClick={() => createMut.mutate()}>
            <Plus className="size-4 mr-1" /> {lang === 'ms' ? 'Cipta Kuiz' : 'Create Quiz'}
          </Button>
        </div>
        {quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{lang === 'ms' ? 'Belum ada kuiz.' : 'No quizzes yet.'}</p>
        ) : (
          <div className="space-y-2">
            {quizzes.map((q) => (
              <div key={q.id} className="rounded-xl border border-border/60 bg-card/40 p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{q.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {q.questions?.length || 0} soalan · {q.timeLimitMin} min · {q.maxAttempts} percubaan · lulus {q.passMark}%
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditQuiz(q)}><Pencil className="size-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteQuiz(q)}><Trash2 className="size-4 text-rose-500" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {quizzes.map((q) => (
        <QuestionsEditor key={q.id} course={course} quiz={q} lang={lang} onChanged={onChanged} />
      ))}

      {/* Edit quiz meta */}
      <Dialog open={!!editQuiz} onOpenChange={(o) => !o && setEditQuiz(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sunting Kuiz</DialogTitle></DialogHeader>
          {editQuiz && (
            <div className="space-y-3 py-2">
              <div><Label>Tajuk</Label><Input value={editQuiz.title} onChange={(e) => setEditQuiz({ ...editQuiz, title: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Masa (min)</Label><Input type="number" value={editQuiz.timeLimitMin} onChange={(e) => setEditQuiz({ ...editQuiz, timeLimitMin: Number(e.target.value) })} /></div>
                <div><Label>Percubaan</Label><Input type="number" value={editQuiz.maxAttempts} onChange={(e) => setEditQuiz({ ...editQuiz, maxAttempts: Number(e.target.value) })} /></div>
                <div><Label>Lulus (%)</Label><Input type="number" value={editQuiz.passMark} onChange={(e) => setEditQuiz({ ...editQuiz, passMark: Number(e.target.value) })} /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
            <Button className="gradient-primary text-white" onClick={() => editQuiz && updateMut.mutate(editQuiz)}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteQuiz} onOpenChange={(o) => !o && setDeleteQuiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam kuiz?</AlertDialogTitle>
            <AlertDialogDescription>Kuiz "{deleteQuiz?.title}" dan semua soalannya akan dipadam.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500" onClick={() => deleteQuiz && deleteMut.mutate(deleteQuiz)}>Padam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function QuestionsEditor({ course, quiz, lang, onChanged }: { course: Course; quiz: Quiz; lang: Lang; onChanged: () => void }) {
  const [editQ, setEditQ] = React.useState<Question | null>(null)
  const [deleteQ, setDeleteQ] = React.useState<Question | null>(null)

  const saveMut = useMutation({
    mutationFn: (q: Partial<Question> & { id?: string }) =>
      q.id
        ? api.courses.quizzes.questions.update(course.id, quiz.id, q.id, q)
        : api.courses.quizzes.questions.create(course.id, quiz.id, q),
    onSuccess: () => { toast.success('Soalan disimpan.'); onChanged(); setEditQ(null) },
    onError: (e: Error) => toast.error(e.message),
  })
  const deleteMut = useMutation({
    mutationFn: (q: Question) => api.courses.quizzes.questions.delete(course.id, quiz.id, q.id),
    onSuccess: () => { toast.success('Soalan dipadam.'); onChanged(); setDeleteQ(null) },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold flex items-center gap-2"><Wand2 className="size-4 text-primary" /> {quiz.title} — Soalan</h4>
        <Button size="sm" variant="outline" onClick={() => setEditQ({} as any)}>
          <Plus className="size-4 mr-1" /> Soalan
        </Button>
      </div>
      {(quiz.questions || []).length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center">Tiada soalan.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
          {quiz.questions?.map((q, i) => (
            <div key={q.id} className="rounded-lg border border-border/50 bg-card/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">#{i + 1}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{q.type.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className="text-[10px]">{q.points} mata</Badge>
                  </div>
                  <p className="text-sm font-medium">{q.text}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditQ(q)}><Pencil className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteQ(q)}><Trash2 className="size-3.5 text-rose-500" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <QuestionEditorDialog
        state={editQ}
        onClose={() => setEditQ(null)}
        onSave={(q) => saveMut.mutate(q)}
      />

      <AlertDialog open={!!deleteQ} onOpenChange={(o) => !o && setDeleteQ(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam soalan?</AlertDialogTitle>
            <AlertDialogDescription>Soalan akan dipadam.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-500" onClick={() => deleteQ && deleteMut.mutate(deleteQ)}>Padam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </GlassCard>
  )
}

function QuestionEditorDialog({ state, onClose, onSave }: { state: Question | null; onClose: () => void; onSave: (q: Partial<Question>) => void }) {
  const [form, setForm] = React.useState<Partial<Question> & { optionsText?: string }>({})
  React.useEffect(() => {
    if (state) {
      const opts = state.options || []
      setForm({
        ...state,
        type: state.type || 'MULTIPLE_CHOICE',
        points: state.points ?? 1,
        optionsText: Array.isArray(opts) ? opts.join('\n') : (typeof opts === 'string' ? JSON.parse(opts || '[]').join('\n') : ''),
      })
    }
  }, [state])

  if (!state) return null

  const submit = () => {
    const options = (form.optionsText || '').split('\n').map((s) => s.trim()).filter(Boolean)
    onSave({
      id: form.id,
      type: form.type,
      text: form.text,
      options,
      correctAnswer: form.correctAnswer,
      explanation: form.explanation,
      points: form.points,
      order: form.order,
    })
  }

  return (
    <Dialog open={!!state} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{form.id ? 'Sunting Soalan' : 'Tambah Soalan'}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
          <div>
            <Label>Teks Soalan</Label>
            <Textarea rows={3} value={form.text || ''} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Jenis</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as QuestionType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Pilihan</SelectItem>
                  <SelectItem value="TRUE_FALSE">Betul / Salah</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Jawapan Pendek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mata</Label>
              <Input type="number" value={form.points ?? 1} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Urutan</Label>
              <Input type="number" value={form.order ?? 1} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
            </div>
          </div>
          {form.type === 'MULTIPLE_CHOICE' && (
            <div>
              <Label>Pilihan (satu per baris)</Label>
              <Textarea rows={4} value={form.optionsText} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} placeholder="Pilihan A&#10;Pilihan B&#10;Pilihan C" />
              <p className="text-xs text-muted-foreground mt-1">Jawapan betul = nombor indeks bermula dari 0 (0 = pilihan pertama).</p>
            </div>
          )}
          {form.type === 'TRUE_FALSE' && (
            <div>
              <Label>Jawapan Betul</Label>
              <Select value={form.correctAnswer || 'true'} onValueChange={(v) => setForm({ ...form, correctAnswer: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Betul</SelectItem>
                  <SelectItem value="false">Salah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {form.type === 'MULTIPLE_CHOICE' && (
            <div>
              <Label>Jawapan Betul (indeks 0-N)</Label>
              <Input type="number" min={0} value={form.correctAnswer || '0'} onChange={(e) => setForm({ ...form, correctAnswer: String(e.target.value) })} />
            </div>
          )}
          {form.type === 'SHORT_ANSWER' && (
            <div>
              <Label>Jawapan Betul</Label>
              <Input value={form.correctAnswer || ''} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} />
            </div>
          )}
          <div>
            <Label>Penjelasan (pilihan)</Label>
            <Textarea rows={2} value={form.explanation || ''} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
          <Button className="gradient-primary text-white" onClick={submit}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CourseEditor
