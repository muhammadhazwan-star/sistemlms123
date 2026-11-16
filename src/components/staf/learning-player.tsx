'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import {
  CheckCircle2, Circle, FileText, Video, FlaskConical, BookOpen, ChevronLeft, ChevronRight,
  Menu, Award, CheckCircle, PartyPopper, StickyNote, Send, Download, X
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Course, Enrollment, Lesson, LessonType, Lang } from '@/lib/types'

export function LearningPlayer() {
  const { user, params, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const enrollmentId = params?.enrollmentId as string | undefined
  const courseId = params?.courseId as string | undefined
  const qc = useQueryClient()

  const enrQuery = useQuery({
    queryKey: ['enrollments', user?.id, courseId],
    queryFn: () => api.enrollments.list({ userId: user!.id, courseId: courseId! }),
    enabled: !!user?.id && !!courseId,
  })

  const enrollment: Enrollment | undefined = enrollmentId
    ? (enrQuery.data?.enrollments || [])[0]
    : (enrQuery.data?.enrollments || [])[0]

  const course = enrollment?.course as Course | undefined

  // Flat lesson list with module context
  const flatLessons: { lesson: Lesson; moduleTitle: string; moduleIdx: number }[] = React.useMemo(() => {
    if (!course?.modules) return []
    return course.modules.flatMap((m, mi) =>
      (m.lessons || []).map((l) => ({ lesson: l, moduleTitle: m.title, moduleIdx: mi }))
    )
  }, [course])

  const completedKey = React.useMemo(() => `lms-completed-${user?.id}-${courseId}`, [user?.id, courseId])
  const [completedSet, setCompletedSet] = React.useState<Set<string>>(new Set())
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(completedKey)
      setCompletedSet(new Set(raw ? JSON.parse(raw) : []))
    } catch { /* ignore */ }
  }, [completedKey])

  const [currentIdx, setCurrentIdx] = React.useState(0)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const markMut = useMutation({
    mutationFn: (vars: { lessonId: string; completed: boolean }) => api.lessons.markProgress(vars.lessonId, vars.completed),
    onSuccess: (_res, vars) => {
      // Update local completion set
      setCompletedSet((prev) => {
        const next = new Set(prev)
        if (vars.completed) next.add(vars.lessonId)
        else next.delete(vars.lessonId)
        try { localStorage.setItem(completedKey, JSON.stringify([...next])) } catch { /* ignore */ }
        return next
      })
      qc.invalidateQueries({ queryKey: ['enrollments', user?.id, courseId] })
      toast.success(lang === 'ms' ? 'Pelajaran ditanda siap' : 'Lesson marked complete')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!courseId) return <ErrorState message={lang === 'ms' ? 'ID kursus tidak ditentukan.' : 'Course ID missing.'} />
  if (enrQuery.isLoading) return <LoadingState label={lang === 'ms' ? 'Memuat pembelajaran...' : 'Loading player...'} />
  if (enrQuery.isError) return <ErrorState message={lang === 'ms' ? 'Tidak dapat memuatkan kursus.' : 'Failed to load course.'} />
  if (!enrollment || !course) {
    return (
      <EmptyState
        icon={BookOpen}
        title={lang === 'ms' ? 'Anda belum mendaftar kursus ini' : 'You are not enrolled in this course'}
        action={<Button onClick={() => navigate('catalog')}>{lang === 'ms' ? 'Lihat Katalog' : 'Browse Catalog'}</Button>}
      />
    )
  }

  if (flatLessons.length === 0) {
    return <EmptyState icon={BookOpen} title={lang === 'ms' ? 'Tiada pelajaran tersedia' : 'No lessons available'} />
  }

  const current = flatLessons[Math.min(currentIdx, flatLessons.length - 1)]
  const currentLesson = current.lesson
  const isCompleted = completedSet.has(currentLesson.id)
  const allCompleted = flatLessons.every((fl) => completedSet.has(fl.lesson.id))
  const progressPct = enrollment.progressPct || 0
  const quizzes = course.quizzes || []
  const totalLessons = flatLessons.length
  const completedCount = flatLessons.filter((fl) => completedSet.has(fl.lesson.id)).length

  const goPrev = () => setCurrentIdx((i) => Math.max(0, i - 1))
  const goNext = () => setCurrentIdx((i) => Math.min(flatLessons.length - 1, i + 1))

  const sidebar = (
    <div className="space-y-3">
      {course.modules.map((m, mi) => (
        <div key={m.id}>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
            {lang === 'ms' ? 'Modul' : 'Module'} {mi + 1}: {m.title}
          </div>
          <div className="space-y-1">
            {m.lessons?.map((l) => {
              const flatIdx = flatLessons.findIndex((fl) => fl.lesson.id === l.id)
              const done = completedSet.has(l.id)
              const active = currentIdx === flatIdx
              return (
                <button
                  key={l.id}
                  onClick={() => { setCurrentIdx(flatIdx); setSheetOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${active ? 'bg-primary/15 text-primary font-medium' : 'hover:bg-accent/60'}`}
                >
                  {done ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> : <Circle className="size-4 text-muted-foreground shrink-0" />}
                  <span className="flex-1 truncate">{l.title}</span>
                  <LessonTypeMini type={l.type} />
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('my-courses')}>
            <ChevronLeft className="size-4" /> {t('action.back', lang)}
          </Button>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">{course.code} · {current.moduleTitle}</div>
            <div className="font-semibold truncate">{course.title}</div>
          </div>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <Menu className="size-4" /> {lang === 'ms' ? 'Pelajaran' : 'Lessons'}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{lang === 'ms' ? 'Senarai Pelajaran' : 'Lesson List'}</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{sidebar}</div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Progress bar */}
      <GlassCard className="p-3">
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground whitespace-nowrap">{completedCount}/{totalLessons}</div>
          <Progress value={progressPct} className="h-2 flex-1" />
          <div className="text-xs font-semibold w-10 text-right">{progressPct}%</div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4">
        {/* Desktop sidebar */}
        <GlassCard className="p-4 hidden lg:block sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin">
          <div className="text-sm font-semibold mb-3">{lang === 'ms' ? 'Pelajaran' : 'Lessons'}</div>
          {sidebar}
        </GlassCard>

        {/* Main content */}
        <div className="space-y-4">
          {progressPct === 100 && (
            <GlassCard className="p-4 border-emerald-300/60 bg-emerald-50/40">
              <div className="flex items-center gap-3">
                <PartyPopper className="size-6 text-emerald-500" />
                <div className="flex-1">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-300">{lang === 'ms' ? 'Tahniah! Kursus Selesai' : 'Congratulations! Course Complete'}</div>
                  <div className="text-xs text-muted-foreground">{lang === 'ms' ? 'Sijil akan dikeluarkan jika lulus kuiz.' : 'Certificate issued if quiz passed.'}</div>
                </div>
                {quizzes.length > 0 && (
                  <Button size="sm" onClick={() => navigate('quiz-player', { quizId: quizzes[0].id, courseId })}>
                    <Award className="size-4 mr-1" /> {lang === 'ms' ? 'Ambil Kuiz' : 'Take Quiz'}
                  </Button>
                )}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">
                  {current.moduleTitle} · {lang === 'ms' ? 'Pelajaran' : 'Lesson'} {currentIdx + 1}/{flatLessons.length}
                </div>
                <h2 className="text-xl font-bold mt-0.5">{currentLesson.title}</h2>
              </div>
              <Badge variant="secondary" className="text-[10px]">{currentLesson.durationMin}m</Badge>
            </div>

            <LessonContent lesson={currentLesson} lang={lang} />

            <LessonNotes lessonId={currentLesson.id} lang={lang} />
          </GlassCard>

          {/* Bottom nav */}
          <GlassCard className="p-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIdx === 0}>
                <ChevronLeft className="size-4" /> {t('action.previous', lang)}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant={isCompleted ? 'secondary' : 'default'}
                  size="sm"
                  disabled={markMut.isPending}
                  onClick={() => markMut.mutate({ lessonId: currentLesson.id, completed: !isCompleted })}
                >
                  <CheckCircle className="size-4 mr-1" />
                  {isCompleted ? (lang === 'ms' ? 'Siap (batal)' : 'Done (undo)') : t('action.complete', lang)}
                </Button>
                {allCompleted && quizzes.length > 0 && (
                  <Button size="sm" className="gradient-primary" onClick={() => navigate('quiz-player', { quizId: quizzes[0].id, courseId })}>
                    <Award className="size-4 mr-1" /> {lang === 'ms' ? 'Ambil Kuiz' : 'Take Quiz'}
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={goNext} disabled={currentIdx === flatLessons.length - 1}>
                {t('action.next', lang)} <ChevronRight className="size-4" />
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function LessonTypeMini({ type }: { type: LessonType }) {
  if (type === 'VIDEO') return <Video className="size-3.5 text-amber-500" />
  if (type === 'PDF') return <FileText className="size-3.5 text-rose-500" />
  if (type === 'LAB') return <FlaskConical className="size-3.5 text-violet-500" />
  return <FileText className="size-3.5 text-sky-500" />
}

function LessonContent({ lesson, lang }: { lesson: Lesson; lang: Lang }) {
  if (lesson.type === 'TEXT') {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{lesson.content || '*Tiada kandungan*'}</ReactMarkdown>
      </div>
    )
  }
  if (lesson.type === 'VIDEO') {
    const url = lesson.content
    const isEmbed = url.includes('youtube') || url.includes('vimeo') || url.includes('youtu.be')
    return (
      <div className="space-y-3">
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          {isEmbed ? (
            <iframe src={url} className="w-full h-full" allowFullScreen title={lesson.title} />
          ) : (
            <video src={url} controls className="w-full h-full" />
          )}
        </div>
        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Video className="size-3.5" /> {lang === 'ms' ? 'Video demo' : 'Demo video'}
        </div>
      </div>
    )
  }
  if (lesson.type === 'PDF') {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center bg-card/40">
        <FileText className="size-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-semibold mb-1">{lang === 'ms' ? 'Dokumen PDF' : 'PDF Document'}</h3>
        <p className="text-sm text-muted-foreground mb-4">{lesson.content}</p>
        <Button asChild variant="secondary">
          <a href={lesson.content} target="_blank" rel="noopener noreferrer">
            <Download className="size-4 mr-1" /> {lang === 'ms' ? 'Muat turun PDF' : 'Download PDF'}
          </a>
        </Button>
      </div>
    )
  }
  if (lesson.type === 'LAB') {
    return <LabContent lesson={lesson} lang={lang} />
  }
  return null
}

function LabContent({ lesson, lang }: { lesson: Lesson; lang: Lang }) {
  let parsed: { prompt?: string; scenario?: string } = {}
  try { parsed = JSON.parse(lesson.content || '{}') } catch { /* ignore */ }
  const [input, setInput] = React.useState('')
  const [response, setResponse] = React.useState<string | null>(null)

  const simulate = () => {
    if (!input.trim()) {
      toast.error(lang === 'ms' ? 'Sila masukkan prompt' : 'Please enter a prompt')
      return
    }
    setResponse(`Respons simulasi: Berdasarkan prompt anda "${input.slice(0, 80)}${input.length > 80 ? '...' : ''}", AI akan menjana...(demo)`)
  }

  return (
    <div className="space-y-4">
      {parsed.scenario && (
        <div className="rounded-xl bg-accent/40 border border-border/60 p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">{lang === 'ms' ? 'Senario' : 'Scenario'}</div>
          <p className="text-sm">{parsed.scenario}</p>
        </div>
      )}
      {parsed.prompt && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{lang === 'ms' ? 'Arahan:' : 'Instruction:'}</span> {parsed.prompt}
        </div>
      )}
      <div>
        <label className="text-sm font-medium mb-1.5 block">{lang === 'ms' ? 'Prompt Anda' : 'Your Prompt'}</label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder={lang === 'ms' ? 'Taip prompt anda di sini...' : 'Type your prompt here...'}
        />
      </div>
      <Button size="sm" onClick={simulate}>
        <Send className="size-4 mr-1" /> {lang === 'ms' ? 'Simulasi Respons' : 'Simulate Response'}
      </Button>
      {response && (
        <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/40 p-4">
          <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase mb-1">{lang === 'ms' ? 'Respons' : 'Response'}</div>
          <p className="text-sm">{response}</p>
        </div>
      )}
    </div>
  )
}

function LessonNotes({ lessonId, lang }: { lessonId: string; lang: Lang }) {
  const key = `lms-note-${lessonId}`
  const [note, setNote] = React.useState('')
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    try { setNote(localStorage.getItem(key) || '') } catch { /* ignore */ }
  }, [key])
  const save = () => {
    try { localStorage.setItem(key, note) } catch { /* ignore */ }
    toast.success(lang === 'ms' ? 'Nota disimpan' : 'Note saved')
    setOpen(false)
  }
  if (!open) {
    return (
      <div className="mt-4 pt-4 border-t border-border/60">
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <StickyNote className="size-4 mr-1" /> {lang === 'ms' ? 'Nota Peribadi' : 'Personal Notes'} {note && <Badge variant="secondary" className="ml-2 text-[10px]">{lang === 'ms' ? 'Tersimpan' : 'Saved'}</Badge>}
        </Button>
      </div>
    )
  }
  return (
    <div className="mt-4 pt-4 border-t border-border/60">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium inline-flex items-center gap-1.5"><StickyNote className="size-4" /> {lang === 'ms' ? 'Nota Peribadi' : 'Personal Notes'}</div>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(false)}><X className="size-4" /></Button>
      </div>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder={lang === 'ms' ? 'Tulis nota anda...' : 'Write your notes...'} />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={save}><CheckCircle className="size-4 mr-1" /> {t('action.save', lang)}</Button>
      </div>
    </div>
  )
}

export default LearningPlayer
