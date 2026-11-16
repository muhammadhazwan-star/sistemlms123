'use client'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, BookOpen, Clock, User as UserIcon, Filter, Layers } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { Course, Category, CourseLevel, Lang } from '@/lib/types'

export function Catalog() {
  const { user, navigate } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'

  const [search, setSearch] = React.useState('')
  const [level, setLevel] = React.useState<string>('all')
  const [categoryId, setCategoryId] = React.useState<string>('all')
  const [language, setLanguage] = React.useState<string>('all')
  const [sort, setSort] = React.useState<string>('newest')

  // debounce
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['courses', { search: debouncedSearch, level, categoryId, language, sort }],
    queryFn: () => api.courses.list({ search: debouncedSearch, level, categoryId, language, status: 'PUBLISHED', sort }),
  })
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => api.categories.list() })

  const courses: Course[] = data?.courses || []
  const categories: Category[] = catData?.categories || []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.catalog', lang)}
        subtitle={lang === 'ms' ? 'Teroka kursus latihan AI yang tersedia.' : 'Browse available AI training courses.'}
      />

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={lang === 'ms' ? 'Cari kursus mengikut tajuk atau kod...' : 'Search courses by title or code...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder={t('label.level', lang)} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'ms' ? 'Semua Tahap' : 'All Levels'}</SelectItem>
                <SelectItem value="PEMULA">{t('level.PEMULA', lang)}</SelectItem>
                <SelectItem value="PERTENGAHAN">{t('level.PERTENGAHAN', lang)}</SelectItem>
                <SelectItem value="LANJUTAN">{t('level.LANJUTAN', lang)}</SelectItem>
                <SelectItem value="SEMUA">{t('level.SEMUA', lang)}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder={lang === 'ms' ? 'Kategori' : 'Category'} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'ms' ? 'Semua Kategori' : 'All Categories'}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder={t('label.language', lang)} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{lang === 'ms' ? 'Semua' : 'All'}</SelectItem>
                <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{lang === 'ms' ? 'Terbaru' : 'Newest'}</SelectItem>
                <SelectItem value="title">{lang === 'ms' ? 'Tajuk A-Z' : 'Title A-Z'}</SelectItem>
                <SelectItem value="duration">{lang === 'ms' ? 'Tempoh Terpendek' : 'Shortest Duration'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Results */}
      {isError ? (
        <ErrorState message={lang === 'ms' ? 'Tidak dapat memuatkan kursus.' : 'Failed to load courses.'} />
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={lang === 'ms' ? 'Tiada kursus dijumpai' : 'No courses found'}
          description={lang === 'ms' ? 'Cuba laraskan penapis atau kata kunci carian.' : 'Try adjusting filters or search keywords.'}
        />
      ) : (
        <>
          <div className="text-xs text-muted-foreground">
            {courses.length} {lang === 'ms' ? 'kursus dijumpai' : 'courses found'}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} lang={lang} onView={() => navigate('course-detail', { courseId: c.id })} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CourseCard({ course, lang, onView }: { course: Course; lang: Lang; onView: () => void }) {
  const totalLessons = (course.modules || []).reduce((a, m) => a + (m.lessons?.length || 0), 0)
  return (
    <GlassCard className="p-5 flex flex-col hover:shadow-lg transition-shadow group">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-[10px] font-mono">{course.code}</Badge>
        <Badge className={levelColor(course.level)}>{t(`level.${course.level}`, lang)}</Badge>
      </div>
      <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-1">{course.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-3 mb-3 flex-1">{course.description || (lang === 'ms' ? 'Tiada deskripsi.' : 'No description.')}</p>
      <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {course.durationHours} {lang === 'ms' ? 'jam' : 'hours'} · {totalLessons} {lang === 'ms' ? 'pelajaran' : 'lessons'}
        </div>
        <div className="flex items-center gap-1.5">
          <UserIcon className="size-3.5" /> {course.instructor?.name || (lang === 'ms' ? 'Jurulatih belum ditetapkan' : 'No instructor')}
        </div>
        {course.category && (
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5" /> {course.category.name}
          </div>
        )}
      </div>
      <Button size="sm" variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={onView}>
        {lang === 'ms' ? 'Lihat Butiran' : 'View Details'}
      </Button>
    </GlassCard>
  )
}

function levelColor(level: CourseLevel): string {
  const m: Record<CourseLevel, string> = {
    PEMULA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    PERTENGAHAN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    LANJUTAN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    SEMUA: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  }
  return m[level] || m.PEMULA
}

export default Catalog
