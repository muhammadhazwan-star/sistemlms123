// Date/time/format utilities for Malaysia locale
export function formatDate(d: string | Date | null | undefined, lang: 'ms' | 'en' = 'ms'): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '-'
  const locale = lang === 'ms' ? 'ms-MY' : 'en-GB'
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(d: string | Date | null | undefined, lang: 'ms' | 'en' = 'ms'): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '-'
  const locale = lang === 'ms' ? 'ms-MY' : 'en-GB'
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export function formatTime(d: string | Date | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })
}

export function relativeTime(d: string | Date | null | undefined): string {
  if (!d) return '-'
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = date.getTime() - Date.now()
  const absSec = Math.abs(diff / 1000)
  const rtf = new Intl.RelativeTimeFormat('ms', { numeric: 'auto' })
  if (absSec < 60) return rtf.format(Math.round(diff / 1000), 'second')
  if (absSec < 3600) return rtf.format(Math.round(diff / 60000), 'minute')
  if (absSec < 86400) return rtf.format(Math.round(diff / 3600000), 'hour')
  if (absSec < 2592000) return rtf.format(Math.round(diff / 86400000), 'day')
  return rtf.format(Math.round(diff / 2592000000), 'month')
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function parseCsv(text: string): string[][] {
  // Lightweight CSV parser (PapaParse is browser-side; this is for preview parsing on server)
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { cur.push(field); field = '' }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = '' }
      else if (c === '\r') { /* skip */ }
      else field += c
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map(r => r.map(c => {
    const s = String(c)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }).join(',')).join('\n')
}

export function downloadFile(content: string | Blob, filename: string, mime = 'text/plain') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    HADIR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    LEWAT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    TIDAK_HADIR: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    CUTI: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    DIKECUALIKAN: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    NOT_STARTED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300',
    PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    DRAFT: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300',
    ARCHIVED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    INACTIVE: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300',
  }
  return map[status] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300'
}
