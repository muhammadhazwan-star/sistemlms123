'use client'
import * as React from 'react'
import { ShieldCheck, Search, Award, XCircle, User, Building2, BookOpen, Calendar, Hash, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { PageHeader, GlassCard, LoadingState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Lang } from '@/lib/types'

interface CertResult {
  certNo: string; verifyCode: string
  userName: string; staffNo: string
  department?: string | null
  courseTitle: string; courseCode: string
  issuedAt: string; expiresAt?: string | null
}

export function VerifyCertificate() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'
  const [certNo, setCertNo] = React.useState('')
  const [verifyCode, setVerifyCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ valid: boolean; certificate?: CertResult } | null>(null)

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certNo && !verifyCode) {
      toast.error(lang === 'ms' ? 'Masukkan nombor sijil atau kod pengesahan' : 'Enter cert number or verify code')
      return
    }
    setLoading(true); setResult(null)
    try {
      const res = await api.certificates.verify(certNo || undefined, verifyCode || undefined)
      setResult(res as any)
      if (!res.valid) toast.error(lang === 'ms' ? 'Sijil tidak sah' : 'Certificate invalid')
      else toast.success(lang === 'ms' ? 'Sijil sah' : 'Certificate valid')
    } catch (err: any) {
      toast.error(err?.message || 'Ralat pengesahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title={lang === 'ms' ? 'Pengesahan Sijil' : 'Certificate Verification'}
        subtitle={lang === 'ms' ? 'Sahkan ketulenan sijil LMS Al Amin.' : 'Verify authenticity of LMS Al Amin certificates.'}
      />

      <GlassCard className="p-6">
        <form onSubmit={verify} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block text-sm"><Hash className="size-3.5 inline mr-1" /> {lang === 'ms' ? 'Nombor Sijil' : 'Certificate Number'}</Label>
              <Input value={certNo} onChange={e => setCertNo(e.target.value)} placeholder="cth: LMS-2024-0001" />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm"><KeyRound className="size-3.5 inline mr-1" /> {lang === 'ms' ? 'Kod Pengesahan' : 'Verify Code'}</Label>
              <Input value={verifyCode} onChange={e => setVerifyCode(e.target.value)} placeholder="xxxx-xxxx-xxxx" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              <Search className="size-4 mr-1" /> {lang === 'ms' ? 'Sahkan' : 'Verify'}
            </Button>
            {(certNo || verifyCode) && (
              <Button type="button" variant="outline" onClick={() => { setCertNo(''); setVerifyCode(''); setResult(null) }}>
                {t('action.cancel', lang)}
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{lang === 'ms' ? 'Isi salah satu medan.' : 'Fill any one field.'}</span>
          </div>
        </form>
      </GlassCard>

      {loading && <LoadingState label={lang === 'ms' ? 'Mengesahkan...' : 'Verifying...'} />}

      {!loading && result && result.valid && result.certificate && (
        <CertValidCard cert={result.certificate} lang={lang} />
      )}

      {!loading && result && !result.valid && (
        <GlassCard className="p-8 text-center border-rose-200">
          <div className="mx-auto size-16 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center mb-4">
            <XCircle className="size-9 text-rose-600" />
          </div>
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 mb-2">{lang === 'ms' ? 'Tidak Sah' : 'Invalid'}</Badge>
          <h3 className="font-semibold text-lg">{lang === 'ms' ? 'Sijil Tidak Dijumpai' : 'Certificate Not Found'}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {lang === 'ms'
              ? 'Nombor sijil atau kod pengesahan tidak sepadan dengan rekod kami. Sila semak dan cuba lagi.'
              : 'The certificate number or verification code did not match our records. Please check and try again.'}
          </p>
        </GlassCard>
      )}
    </div>
  )
}

function CertValidCard({ cert, lang }: { cert: CertResult; lang: Lang }) {
  return (
    <GlassCard className="p-0 overflow-hidden">
      {/* Ribbon header */}
      <div className="gradient-primary p-5 text-white flex items-center gap-3">
        <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
          <Award className="size-7" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider opacity-80">{lang === 'ms' ? 'Sijil Disahkan' : 'Verified Certificate'}</div>
          <div className="text-lg font-bold">{lang === 'ms' ? 'LMS Al Amin' : 'LMS Al Amin'}</div>
        </div>
        <div className="ml-auto">
          <Badge className="bg-white/20 text-white border-white/30 backdrop-blur">
            <ShieldCheck className="size-3.5 mr-1" /> {lang === 'ms' ? 'Sahih' : 'Valid'}
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{lang === 'ms' ? 'Dikeluarkan Kepada' : 'Issued To'}</div>
          <div className="text-xl font-bold">{cert.userName}</div>
          <div className="text-sm text-muted-foreground">{cert.staffNo}{cert.department ? ` · ${cert.department}` : ''}</div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <InfoRow icon={BookOpen} label={lang === 'ms' ? 'Kursus' : 'Course'} value={`${cert.courseCode} — ${cert.courseTitle}`} />
          <InfoRow icon={Building2} label={lang === 'ms' ? 'Jabatan' : 'Department'} value={cert.department || '-'} />
          <InfoRow icon={Calendar} label={lang === 'ms' ? 'Tarikh Dikeluarkan' : 'Issued At'} value={formatDate(cert.issuedAt, lang)} />
          <InfoRow icon={Calendar} label={lang === 'ms' ? 'Tamat Tempoh' : 'Expires At'} value={cert.expiresAt ? formatDate(cert.expiresAt, lang) : (lang === 'ms' ? 'Tiada' : 'None')} />
          <InfoRow icon={Hash} label={lang === 'ms' ? 'No. Sijil' : 'Cert No.'} value={cert.certNo} mono />
          <InfoRow icon={KeyRound} label={lang === 'ms' ? 'Kod Pengesahan' : 'Verify Code'} value={cert.verifyCode} mono />
        </div>
      </div>
    </GlassCard>
  )
}

function InfoRow({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}

export default VerifyCertificate
