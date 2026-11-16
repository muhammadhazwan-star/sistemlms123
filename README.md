# LMS Al Amin — Sistem Pengurusan Pembelajaran

Sistem Pengurusan Pembelajaran (LMS) berasaskan web untuk **Al Amin Edu Oasis, Malaysia**.
Direka untuk latihan & kursus Kecerdasan Buatan (AI) kakitangan, dengan modul kehadiran
digital automatik (QR / kod sesi / import CSV) dan pensijilan boleh disahkan.

Dibina mengikut Dokumen Keperluan Produk (PRD) v1.0.

---

## Tindanan Teknologi

| Lapisan | Teknologi |
|---------|-----------|
| Rangka kerja | Next.js 16 (App Router) + TypeScript 5 |
| Gaya UI | Tailwind CSS 4 + shadcn/ui (New York) + glassmorphism |
| Pangkalan data | Prisma ORM + SQLite (dummy / prototaip) |
| Keadaan | Zustand (UI) + TanStack Query (pelayan) |
| Carta | Recharts |
| Kod QR | qrcode |
| PDF Sijil | jsPDF |
| CSV | PapaParse |
| Ikon | lucide-react |

## Peranan Pengguna (RBAC)

- **Admin** — Pengurusan pengguna, jabatan, kategori, log audit, reset data dummy
- **HR / Pengurus** — Papan pasukan, tugaskan kursus wajib, lulus pembetulan kehadiran, laporan
- **Jurulatih** — Cipta/edit kursus & kuiz, jadual sesi, paparan QR projektor, senarai kehadiran, import/eksport CSV
- **Staf (Pelajar)** — Daftar kursus, pemain pelajaran, kuiz, daftar kehadiran (QR/kod), muat turun sijil

## Akaun Demo

Kata laluan untuk semua akaun demo: `demo123`

| Peranan | E-mel |
|---------|-------|
| Admin | `user1000@alaamin.my` |
| HR / Pengurus | `user1001@alaamin.my` |
| Jurulatih | `user1003@alaamin.my` |
| Staf | `user1007@alaamin.my` |

## Pemasangan Tempatan

### Prasyarat

- [Bun](https://bun.sh) runtime
- Projek Supabase dengan pangkalan data PostgreSQL
- Akses rangkaian ke Supabase (IPv6 untuk sambungan langsung, atau IPv4 via pooler)

### Langkah Pemasangan

```bash
# 1. Pasang dependencies
bun install

# 2. Salin fail persekitaran
cp .env.example .env
# Edit .env dengan connection string Supabase anda

# 3. Push skema Prisma ke Supabase PostgreSQL
bun run db:push

# 4. Semai data dummy (40 pengguna, 9 kursus, 24 sesi, 600+ kehadiran)
bun run prisma/seed/index.ts

# 5. Jalankan pelayan dev
bun run dev
```

Buka `http://localhost:3000`.

### Alternatif: Supabase CLI

Jika anda lebih suka menggunakan Supabase CLI (melalui Management API HTTPS):

```bash
# Pasang Supabase CLI
npm install -g supabase

# Log masuk (dengan personal access token dari supabase.com/dashboard/account/tokens)
supabase login

# Pautkan projek
supabase link --project-ref ciwtcblcmvcpxsfcjcnp

# Push migration SQL
supabase db push
```

Fail migration awal telah disediakan di `supabase/migrations/20261116000000_init/migration.sql`.

## Konfigurasi Pangkalan Data (Supabase)

Projek ini menggunakan **Supabase PostgreSQL** sebagai pangkalan data.

### Sambungan Connection String

Dua pilihan sambungan:

| Jenis | Host | Port | Format Username |
|-------|------|------|-----------------|
| **Direct** (IPv6) | `db.{ref}.supabase.co` | 5432 | `postgres` |
| **Pooler / Supavisor** (IPv4) | `aws-0-{region}.pooler.supabase.com` | 6543 | `postgres.{ref}` |

**Disyorkan: Pooler (IPv4)** — berfungsi di lebih banyak persekitaran (Vercel, Netlify, sandbox).

Untuk mendapatkan connection string pooler:
1. Pergi ke **Supabase Dashboard → Database → Connection string**
2. Pilih tab **Connection pooling** / **Supavisor**
3. Salin URI (format: `postgresql://postgres.{ref}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres`)

> **Penting:** Jika kata laluan mengandungi `@`, gantikan dengan `%40` dalam URL
> (contoh: `Hazwanrais@12` → `Hazwanrais%4012`).

### Butiran Projek Supabase (contoh)

```
Project URL:    https://ciwtcblcmvcpxsfcjcnp.supabase.co
Project Ref:    ciwtcblcmvcpxsfcjcnp
Region:         ap-southeast-1 (Singapore)
```

## Skrip

| Skrip | Penerangan |
|-------|-----------|
| `bun run dev` | Pelayan pembangunan (port 3000) |
| `bun run lint` | ESLint |
| `bun run db:push` | Sinkron skema Prisma ke PostgreSQL |
| `bun run db:generate` | Jana Prisma Client |
| `bun run prisma/seed/index.ts` | Semai data dummy |

## Struktur Folder

```
prisma/
  schema.prisma          # Skema pangkalan data (semua entiti LMS)
  seed/index.ts          # Skrip semai data dummy
src/
  app/
    api/                 # API routes (REST, lapisan service)
    layout.tsx           # Root layout + providers
    page.tsx             # SPA entry (bootstrap sesi)
  components/
    auth/                # Log masuk
    shell/               # AppShell (sidebar, topbar, footer)
    staf/                # Pandangan Staf
    jurulatih/           # Pandangan Jurulatih
    hr-admin/            # Pandangan HR & Admin
    common/              # Komponen dikongsi (profil, ui-bits)
    ui/                  # shadcn/ui components
  lib/
    api.ts               # Klien API (lapisan akses data)
    db.ts                # Prisma Client
    store.ts             # Zustand store
    types.ts             # Jenis dikongsi
    i18n.ts              # Kamus BM / EN
    format.ts            # Utiliti tarikh, CSV, format
view-router.tsx          # Penghala pandangan berasaskan peranan
```

## Ciri Utama (merujuk PRD)

- **AUTH** — Log masuk, RBAC, tukar peranan demo, profil dwibahasa (BM/EN)
- **CRS** — Katalog kursus dengan carian/penapis/isihan, butiran, pendaftaran, penyunting kursus/modul/pelajaran
- **LRN** — Pemain pelajaran (teks/video/PDF/makmal), penjejakan kemajuan, kuiz dengan pemasa & had cubaan
- **ATT** — Sesi latihan, QR dinamik, kod 6-digit dengan tempoh luput, kemasukan pukal, import CSV dengan pratonton, eksport CSV/PDF, jejak audit
- **CERT** — Sijil PDF dwibahasa dengan nombor pengesahan, halaman pengesahan awam
- **RPT** — Laporan penyiapan, kehadiran, keputusan kuiz, jurang kemahiran
- **ADM** — Pengurusan pengguna (termasuk import CSV), jabatan/kategori, notifikasi, log audit, reset data dummy

## Pematuhan

- **PDPA 2010** — Reka bentuk bersedia untuk pematuhan Akta Perlindungan Data Peribadi Malaysia
- **WCAG 2.1 AA** — Kontras warna, navigasi papan kekunci, label ARIA
- **Responsif** — 360px hingga 1920px, mesra sentuh
- **Zon waktu** — Asia/Kuala_Lumpur (UTC+8), format tarikh DD/MM/YYYY

## Migrasi ke Produksi

Pangkalan data dummy (SQLite + Prisma) boleh diganti dengan pangkalan data sebenar
(PostgreSQL/Supabase) tanpa mengubah komponen UI — semua akses data diabstrak melalui
`src/lib/api.ts`.

## Lesen

Prototaip untuk Al Amin Edu Oasis. Data adalah rekaan; tiada maklumat peribadi sebenar.

---

© 2026 Al Amin Edu Oasis, Malaysia.
