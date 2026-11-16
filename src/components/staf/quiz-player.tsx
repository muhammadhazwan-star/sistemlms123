'use client'
import * as React from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Award, Clock, AlertTriangle, CheckCircle2, XCircle, ArrowLeft, ArrowRight, RefreshCw, Info
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Course, Quiz, Question, Lang } from '@/lib/types'

export function QuizPlayer() {
  const { user, params, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const quizId = params?.quizId as string | undefined
  const courseId = params?.courseId as string | undefined

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.courses.get(courseId!),
    enabled: !!courseId,
  })
  const attemptsQuery = useQuery({
    queryKey: ['quiz-attempts', quizId],
    queryFn: () => api.quizzes.attempts(quizId!),
    enabled: !!quizId,
  })

  const course = courseQuery.data?.course as Course | undefined
  const quiz: Quiz | undefined = course?.quizzes?.find((q) => q.id === quizId)
  const attempts: any[] = attemptsQuery.data?.attempts || []
  const passedAttempts = attempts.filter((a) => a.passed)
  const remainingAttempts = quiz ? Math.max(0, quiz.maxAttempts - attempts.length) : 0
  const maxReached = !!quiz && attempts.length >= quiz.maxAttempts && passedAttempts.length === 0

  const [answers, setAnswers] = React.useState<Record<string, string>>({})
  const [submitted, setSubmitted] = React.useState(false)
  const [result, setResult] = React.useState<{ graded: any[]; score: number; passed: boolean } | null>(null)
  const [remainingSec, setRemainingSec] = React.useState(0)

  React.useEffect(() => {
    if (quiz && quiz.timeLimitMin > 0 && !submitted) {
      setRemainingSec(quiz.timeLimitMin * 60)
    }
  }, [quiz?.id, quiz?.timeLimitMin, submitted])

  const submitMut = useMutation({
    mutationFn: () => api.quizzes.submit(quizId!, answers),
    onSuccess: (res) => {
      setResult({ graded: res.graded, score: res.score, passed: res.passed })
      setSubmitted(true)
      if (res.passed) toast.success(lang === 'ms' ? `Lulus! Skor: ${res.score}%` : `Passed! Score: ${res.score}%`)
      else toast.error(lang === 'ms' ? `Gagal. Skor: ${res.score}%` : `Failed. Score: ${res.score}%`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleSubmit = React.useCallback(() => {
    if (!quiz) return
    const unanswered = quiz.questions.filter((q) => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      const ok = confirm(lang === 'ms' ? `${unanswered.length} soalan belum dijawab. Hantar juga?` : `${unanswered.length} unanswered. Submit anyway?`)
      if (!ok) return
    }
    submitMut.mutate()
  }, [quiz, answers, lang, submitMut])

  const handleSubmitRef = React.useRef(handleSubmit)
  React.useEffect(() => { handleSubmitRef.current = handleSubmit }, [handleSubmit])

  React.useEffect(() => {
    if (!quiz || submitted || remainingSec <= 0) return
    const id = setInterval(() => {
      setRemainingSec((s) => {
        if (s <= 1) {
          clearInterval(id)
          // auto-submit
          handleSubmitRef.current()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [quiz?.id, submitted])

  function reset() {
    setAnswers({})
    setSubmitted(false)
    setResult(null)
    if (quiz) setRemainingSec(quiz.timeLimitMin * 60)
  }

  if (!quizId || !courseId) return <ErrorState message={lang === 'ms' ? 'Parameter kuiz hilang.' : 'Quiz parameters missing.'} />
  if (courseQuery.isLoading || attemptsQuery.isLoading) return <LoadingState label={lang === 'ms' ? 'Memuat kuiz...' : 'Loading quiz...'} />
  if (courseQuery.isError || !quiz) return <ErrorState message={lang === 'ms' ? 'Kuiz tidak dijumpai.' : 'Quiz not found.'} />

  const mm = Math.floor(remainingSec / 60).toString().padStart(2, '0')
  const ss = (remainingSec % 60).toString().padStart(2, '0')

  // Result screen
  if (submitted && result) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <GlassCard className={`p-6 text-center ${result.passed ? 'border-emerald-300/60 bg-emerald-50/40' : 'border-rose-300/60 bg-rose-50/40'}`}>
          {result.passed ? <CheckCircle2 className="size-14 text-emerald-500 mx-auto mb-3" /> : <XCircle className="size-14 text-rose-500 mx-auto mb-3" />}
          <h2 className="text-2xl font-bold mb-1">
            {result.passed ? (lang === 'ms' ? 'Lulus!' : 'Passed!') : (lang === 'ms' ? 'Gagal' : 'Failed')}
          </h2>
          <div className="text-4xl font-bold mb-1">{result.score}%</div>
          <p className="text-sm text-muted-foreground">{lang === 'ms' ? `Markah lulus: ${quiz.passMark}%` : `Pass mark: ${quiz.passMark}%`}</p>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="font-semibold mb-3">{lang === 'ms' ? 'Semakan Jawapan' : 'Answer Review'}</h3>
          <div className="space-y-4">
            {result.graded.map((g, i) => {
              const q = quiz.questions.find((x) => x.id === g.questionId)
              if (!q) return null
              return (
                <div key={g.questionId} className={`rounded-xl p-4 border ${g.correct ? 'border-emerald-300/60 bg-emerald-50/30' : 'border-rose-300/60 bg-rose-50/30'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {g.correct ? <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" /> : <XCircle className="size-4 text-rose-500 mt-0.5 shrink-0" />}
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground mb-0.5">{lang === 'ms' ? 'Soalan' : 'Question'} {i + 1}</div>
                      <div className="font-medium text-sm">{q.text}</div>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 pl-6">
                    <div><span className="text-muted-foreground">{lang === 'ms' ? 'Jawapan anda:' : 'Your answer:'}</span> <span className={g.correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>{g.userAnswer || '-'}</span></div>
                    {!g.correct && <div><span className="text-muted-foreground">{lang === 'ms' ? 'Jawapan betul:' : 'Correct answer:'}</span> <span className="text-emerald-700 dark:text-emerald-300">{g.correctAnswer}</span></div>}
                    {g.explanation && <div className="text-muted-foreground pt-1"><Info className="size-3 inline mr-1" />{g.explanation}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        <div className="flex items-center justify-between gap-2">
          {remainingAttempts > 0 && !result.passed ? (
            <Button variant="outline" onClick={reset}><RefreshCw className="size-4 mr-1" /> {t('action.retry', lang)} ({remainingAttempts} {lang === 'ms' ? 'cubaan lagi' : 'left'})</Button>
          ) : <div />}
          <Button onClick={() => navigate('my-courses')}><ArrowLeft className="size-4 mr-1" /> {lang === 'ms' ? 'Kembali ke Kursus' : 'Back to Courses'}</Button>
        </div>
      </div>
    )
  }

  // Max attempts reached
  if (maxReached) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <GlassCard className="p-6 text-center border-amber-300/60 bg-amber-50/40">
          <AlertTriangle className="size-14 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">{lang === 'ms' ? 'Had cubaan tercapai' : 'Max attempts reached'}</h2>
          <p className="text-sm text-muted-foreground">
            {lang === 'ms' ? `Anda telah menggunakan ${attempts.length}/${quiz.maxAttempts} cubaan tanpa lulus.` : `You've used ${attempts.length}/${quiz.maxAttempts} attempts without passing.`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'ms' ? 'Sila hubungi jurulatih atau pentadbir untuk bantuan.' : 'Please contact your trainer or admin for help.'}</p>
        </GlassCard>
        <div className="flex justify-center">
          <Button onClick={() => navigate('my-courses')}><ArrowLeft className="size-4 mr-1" /> {lang === 'ms' ? 'Kembali ke Kursus' : 'Back to Courses'}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('my-courses')}>
          <ArrowLeft className="size-4" /> {t('action.back', lang)}
        </Button>
        <div className="flex items-center gap-2">
          {quiz.timeLimitMin > 0 && (
            <Badge variant="outline" className={`font-mono ${remainingSec < 60 ? 'text-rose-600 border-rose-300' : ''}`}>
              <Clock className="size-3 mr-1" /> {mm}:{ss}
            </Badge>
          )}
        </div>
      </div>

      <GlassCard className="p-5">
        <div className="flex items-start gap-3">
          <Award className="size-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{quiz.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
              <span>{quiz.questions.length} {lang === 'ms' ? 'soalan' : 'questions'}</span>
              <span>{lang === 'ms' ? 'Markah Lulus' : 'Pass Mark'}: {quiz.passMark}%</span>
              {quiz.timeLimitMin > 0 && <span>{lang === 'ms' ? 'Masa' : 'Time'}: {quiz.timeLimitMin}m</span>}
              <span>{lang === 'ms' ? 'Cubaan' : 'Attempts'}: {attempts.length}/{quiz.maxAttempts}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Previous attempts */}
      {attempts.length > 0 && (
        <GlassCard className="p-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{lang === 'ms' ? 'Cubaan Lepas' : 'Previous Attempts'}</div>
          <div className="flex flex-wrap gap-2">
            {attempts.map((a, i) => (
              <Badge key={a.id} variant="outline" className={a.passed ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : 'border-rose-300 text-rose-700 dark:text-rose-300'}>
                #{i + 1}: {a.score}% {a.passed ? '✓' : '✗'}
              </Badge>
            ))}
          </div>
        </GlassCard>
      )}

      <Separator />

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            idx={idx}
            lang={lang}
            value={answers[q.id] || ''}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
          />
        ))}
      </div>

      {/* Submit bar */}
      <div className="sticky bottom-4 z-10">
        <GlassCard className="p-3 glass-strong">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              {Object.keys(answers).length}/{quiz.questions.length} {lang === 'ms' ? 'dijawab' : 'answered'}
            </div>
            <Button disabled={submitMut.isPending} onClick={handleSubmit}>
              {submitMut.isPending ? (lang === 'ms' ? 'Menghantar...' : 'Submitting...') : t('action.submit', lang)}
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function QuestionCard({ question, idx, lang, value, onChange }: {
  question: Question; idx: number; lang: Lang; value: string; onChange: (v: string) => void
}) {
  let options: string[] = []
  if (question.type === 'MULTIPLE_CHOICE') {
    try { options = JSON.parse(question.options) as string[] } catch { options = [] }
  } else if (question.type === 'TRUE_FALSE') {
    options = ['Betul', 'Salah']
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-start gap-2 mb-3">
        <div className="size-6 rounded-md gradient-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</div>
        <div className="flex-1">
          <Badge variant="secondary" className="text-[10px] mb-1">
            {question.type === 'MULTIPLE_CHOICE' ? (lang === 'ms' ? 'Pilihan' : 'Multiple Choice') :
              question.type === 'TRUE_FALSE' ? (lang === 'ms' ? 'Betul/Salah' : 'True/False') :
              (lang === 'ms' ? 'Jawapan Pendek' : 'Short Answer')}
          </Badge>
          <div className="font-medium">{question.text}</div>
        </div>
      </div>

      {question.type === 'SHORT_ANSWER' ? (
        <div className="pl-8">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={lang === 'ms' ? 'Tulis jawapan anda...' : 'Type your answer...'}
          />
        </div>
      ) : (
        <div className="pl-8">
          <RadioGroup value={value} onValueChange={onChange}>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <RadioGroupItem value={opt} id={`${question.id}-${i}`} />
                  <Label htmlFor={`${question.id}-${i}`} className="font-normal cursor-pointer text-sm">{opt}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}
    </GlassCard>
  )
}

export default QuizPlayer
