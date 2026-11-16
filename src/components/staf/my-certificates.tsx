'use client'
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { jsPDF } from 'jspdf'
import { Award, Download, Copy, Calendar, FileCheck, ShieldCheck } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import { formatDate } from '@/lib/format'
import { PageHeader, GlassCard, EmptyState, LoadingState, ErrorState } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { Certificate, Lang } from '@/lib/types'

export function MyCertificates() {
  const { user } = useAppStore()
  const lang = (user?.language as Lang) || 'ms'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['certificates', user?.id],
    queryFn: () => api.certificates.list(user!.id),
    enabled: !!user?.id,
  })

  if (isLoading) return <LoadingState label={lang === 'ms' ? 'Memuat sijil...' : 'Loading certificates...'} />
  if (isError) return <ErrorState message={lang === 'ms' ? 'Tidak dapat memuatkan sijil.' : 'Failed to load certificates.'} />

  const certificates: Certificate[] = data?.certificates || []

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(lang === 'ms' ? 'Kod pengesahan disalin' : 'Verify code copied')
    } catch {
      toast.error(lang === 'ms' ? 'Tidak dapat menyalin' : 'Copy failed')
    }
  }

  const downloadPdf = (cert: Certificate) => {
    try {
      const doc = generateCertificatePdf(cert, user?.name || '', lang)
      doc.save(`${cert.certNo}.pdf`)
      toast.success(lang === 'ms' ? 'Sijil dimuat turun' : 'Certificate downloaded')
    } catch (e) {
      toast.error(lang === 'ms' ? 'Gagal menjana PDF' : 'Failed to generate PDF')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.myCertificates', lang)}
        subtitle={lang === 'ms' ? `${certificates.length} sijil diperoleh.` : `${certificates.length} certificates earned.`}
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title={lang === 'ms' ? 'Tiada sijil lagi' : 'No certificates yet'}
          description={lang === 'ms' ? 'Selesaikan kursus dan lulus kuiz untuk menerima sijil.' : 'Complete courses and pass quizzes to earn certificates.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((c) => (
            <GlassCard key={c.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="size-12 rounded-xl gradient-primary text-white flex items-center justify-center shadow-md">
                  <Award className="size-6" />
                </div>
                <Badge variant="outline" className="font-mono text-[10px]">{c.certNo}</Badge>
              </div>
              <h3 className="font-semibold text-base leading-snug line-clamp-2">{c.course?.title}</h3>
              <div className="text-xs text-muted-foreground mb-3">{c.course?.code}</div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {lang === 'ms' ? 'Dikeluarkan' : 'Issued'}: {formatDate(c.issuedAt, lang)}</div>
                {c.expiresAt && (
                  <div className="flex items-center gap-1.5"><Calendar className="size-3.5" /> {lang === 'ms' ? 'Tamat' : 'Expires'}: {formatDate(c.expiresAt, lang)}</div>
                )}
                <div className="flex items-center gap-1.5 font-mono"><ShieldCheck className="size-3.5" /> {c.verifyCode}</div>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <Button size="sm" className="w-full" onClick={() => downloadPdf(c)}>
                  <Download className="size-4 mr-1" /> {lang === 'ms' ? 'Muat Turun Sijil (PDF)' : 'Download (PDF)'}
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={() => copyCode(c.verifyCode)}>
                  <Copy className="size-4 mr-1" /> {lang === 'ms' ? 'Salin Kod Pengesahan' : 'Copy Verify Code'}
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassCard className="p-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <FileCheck className="size-4 mt-0.5 shrink-0" />
          <div>
            {lang === 'ms'
              ? 'Setiap sijil mempunyai kod pengesahan unik. Kongsi kod ini untuk pengesahan ketulenan sijil oleh pihak ketiga.'
              : 'Each certificate has a unique verification code. Share this code for third-party authenticity verification.'}
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

function generateCertificatePdf(cert: Certificate, userName: string, lang: Lang): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Outer border
  doc.setDrawColor(13, 148, 136)
  doc.setLineWidth(2)
  doc.rect(8, 8, pageW - 16, pageH - 16)
  // Inner border
  doc.setLineWidth(0.4)
  doc.rect(12, 12, pageW - 24, pageH - 24)

  // Header org name
  doc.setTextColor(13, 148, 136)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Al Amin Edu Oasis', pageW / 2, 28, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text('Pusat Latihan Kecerdasan Buatan', pageW / 2, 35, { align: 'center' })

  // Decorative line
  doc.setDrawColor(13, 148, 136)
  doc.setLineWidth(0.6)
  doc.line(pageW / 2 - 50, 40, pageW / 2 + 50, 40)

  // Title
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(lang === 'ms' ? 'SIJIL TAMAT LATIHAN' : 'CERTIFICATE OF COMPLETION', pageW / 2, 52, { align: 'center' })
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(lang === 'ms' ? 'Sijil ini dianugerahkan kepada' : 'This certificate is presented to', pageW / 2, 62, { align: 'center' })

  // Recipient name
  doc.setTextColor(13, 148, 136)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(userName || 'Staf', pageW / 2, 75, { align: 'center' })

  // Course completion line
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(lang === 'ms' ? 'atas kejayaan menamatkan kursus latihan' : 'for successfully completing the training course', pageW / 2, 85, { align: 'center' })

  // Course title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(20, 20, 20)
  doc.text(cert.course?.title || '', pageW / 2, 95, { align: 'center' })

  // Course code
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Kod Kursus / Course Code: ${cert.course?.code || '-'}`, pageW / 2, 102, { align: 'center' })

  // Footer info: cert no, issued, verify code
  const issued = formatDate(cert.issuedAt, lang)
  const expires = cert.expiresAt ? formatDate(cert.expiresAt, lang) : '-'
  const fy = pageH - 40
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(40, fy, 90, fy)
  doc.line(pageW - 90, fy, pageW - 40, fy)

  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(lang === 'ms' ? 'Tarikh Dikeluarkan' : 'Issued On', 65, fy + 5, { align: 'center' })
  doc.text(issued, 65, fy + 10, { align: 'center' })

  doc.text(lang === 'ms' ? 'Tandatangan' : 'Signature', pageW - 65, fy + 5, { align: 'center' })
  doc.text('Al Amin Edu Oasis', pageW - 65, fy + 10, { align: 'center' })

  // Cert no and verify code
  doc.setFontSize(10)
  doc.setTextColor(20, 20, 20)
  doc.text(`No. Sijil: ${cert.certNo}`, pageW / 2, pageH - 25, { align: 'center' })
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`${lang === 'ms' ? 'Tamat Tempoh' : 'Expires'}: ${expires}`, pageW / 2, pageH - 20, { align: 'center' })
  doc.text(`Kod Pengesahan / Verify Code: ${cert.verifyCode}`, pageW / 2, pageH - 15, { align: 'center' })

  return doc
}

export default MyCertificates
