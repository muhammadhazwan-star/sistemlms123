import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Export attendance as CSV (ATT-07)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'csv'

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      course: true,
      trainer: true,
      attendances: { include: { user: { include: { department: true } } } },
    }
  })
  if (!session) return NextResponse.json({ error: 'Sesi tidak dijumpai' }, { status: 404 })

  const rows = session.attendances.map(a => ({
    staffNo: a.user.staffNo,
    name: a.user.name,
    department: a.user.department?.name || '',
    status: a.status,
    checkIn: a.checkInAt ? new Date(a.checkInAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : '',
    checkOut: a.checkOutAt ? new Date(a.checkOutAt).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' }) : '',
    method: a.method,
    remarks: a.remarks || '',
  }))

  if (format === 'csv') {
    const header = ['Nombor Staf', 'Nama', 'Jabatan', 'Status', 'Daftar Masuk', 'Daftar Keluar', 'Kaedah', 'Catatan']
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push([r.staffNo, `"${r.name}"`, `"${r.department}"`, r.status, r.checkIn, r.checkOut, r.method, `"${r.remarks}"`].join(','))
    }
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="kehadiran-${session.title.replace(/\s+/g, '-')}.csv"`,
      }
    })
  }

  // PDF (simple printable HTML)
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Laporan Kehadiran</title>
  <style>body{font-family:sans-serif;padding:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left;font-size:12px}th{background:#0d9488;color:#fff}</style>
  </head><body>
  <h1>Laporan Kehadiran Sesi Latihan</h1>
  <p><b>Sesi:</b> ${session.title}<br/><b>Tarikh:</b> ${new Date(session.date).toLocaleDateString('ms-MY')}<br/><b>Mod:</b> ${session.mode}</p>
  <table><thead><tr><th>Nombor Staf</th><th>Nama</th><th>Jabatan</th><th>Status</th><th>Daftar Masuk</th><th>Kaedah</th><th>Catatan</th></tr></thead><tbody>
  ${rows.map(r => `<tr><td>${r.staffNo}</td><td>${r.name}</td><td>${r.department}</td><td>${r.status}</td><td>${r.checkIn}</td><td>${r.method}</td><td>${r.remarks}</td></tr>`).join('')}
  </tbody></table></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
