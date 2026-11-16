// Seed data for LMS Al Amin - comprehensive realistic Malaysian dummy data
// Run via: bun run prisma/seed/index.ts
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const db = new PrismaClient()

// Malaysian names across communities
const MALAY = ['Ahmad', 'Siti', 'Mohd', 'Nur', 'Hafiz', 'Aishah', 'Razak', 'Faridah', 'Kamal', 'Zainab', 'Faizal', 'Rosmah', 'Ismail', 'Aminah', 'Hassan', 'Khadijah', 'Azlan', 'Norliza', 'Rahman', 'Fatimah']
const CHINESE = ['Tan', 'Lim', 'Lee', 'Wong', 'Goh', 'Chan', 'Yeap', 'Chong', 'Ong', 'Teoh']
const CHINESE_GIVEN = ['Wei', 'Mei', 'Hui', 'Jia', 'Yan', 'Boon', 'Kah', 'Ling', 'Seng', 'Pei']
const INDIAN = ['Kumar', 'Raj', 'Devan', 'Anand', 'Suresh', 'Priya', 'Lakshmi', 'Mohan', 'Ravi', 'Kavita']
const SURNAMES_SUFFIX = ['bin Hassan', 'binti Ibrahim', 'bin Abdullah', 'binti Omar', 'bin Yusof', 'binti Ali']

function pickName(i: number) {
  const communities = ['malay', 'chinese', 'indian']
  const c = communities[i % communities.length]
  if (c === 'malay') {
    const g = i % 2 === 0
    return `${MALAY[i % MALAY.length]} ${SURNAMES_SUFFIX[i % SURNAMES_SUFFIX.length]}`
  }
  if (c === 'chinese') {
    return `${CHINESE[i % CHINESE.length]} ${CHINESE_GIVEN[i % CHINESE_GIVEN.length]} ${CHINESE_GIVEN[(i + 3) % CHINESE_GIVEN.length]}`
  }
  return `${INDIAN[i % INDIAN.length]} a/l ${INDIAN[(i + 2) % INDIAN.length]}`
}

const DEPARTMENTS = [
  { code: 'IT', name: 'Teknologi Maklumat' },
  { code: 'HR', name: 'Sumber Manusia' },
  { code: 'FIN', name: 'Kewangan & Pentadbiran' },
  { code: 'CUST', name: 'Khidmat Pelanggan' },
  { code: 'OPS', name: 'Operasi' },
  { code: 'TRAIN', name: 'Latihan & Pembangunan' },
]

const CATEGORIES = [
  { name: 'Asas AI', description: 'Pengenalan kepada kecerdasan buatan' },
  { name: 'Kejuruteraan Prompt', description: 'Teknik prompt berkesan' },
  { name: 'Automasi', description: 'Automasi kerja dengan AI' },
  { name: 'Etika & Keselamatan', description: 'Tadbir urus, privasi, keselamatan' },
  { name: 'Pembangunan', description: 'Aplikasi AI untuk pembangun' },
]

type CourseSeed = {
  code: string; title: string; desc: string; level: 'PEMULA' | 'PERTENGAHAN' | 'LANJUTAN' | 'SEMUA'
  catIdx: number; durationHours: number; language: string; status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  outcomes: string[]; syllabus: string[]
  modules: { title: string; lessons: { title: string; type: 'TEXT' | 'VIDEO' | 'PDF' | 'LAB'; durationMin: number; content: string }[] }[]
  quiz: { title: string; timeLimitMin: number; maxAttempts: number; passMark: number
    questions: { type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'; text: string; options: string[]; correctAnswer: string; explanation?: string }[] }
}

const COURSES: CourseSeed[] = [
  {
    code: 'AI-101', title: 'Asas Kecerdasan Buatan', level: 'PEMULA', catIdx: 0, durationHours: 4, language: 'ms', status: 'PUBLISHED',
    desc: 'Pengenalan menyeluruh kepada Kecerdasan Buatan (AI), Pembelajaran Mesin (ML) dan AI generatif. Sesuai untuk semua kakitangan tanpa latar teknikal.',
    outcomes: ['Memahami konsep asas AI dan ML', 'Mengenal pasti jenis AI generatif', 'Membezakan mitos dan realiti AI', 'Menyenaraikan kegunaan AI di tempat kerja Malaysia'],
    syllabus: ['Definasi dan sejarah AI', 'Jenis AI: sempit, umum, generatif', 'ML asas: data, model, latihan', 'AI generatif dan LLM', 'Kegunaan praktikal di Malaysia'],
    modules: [
      { title: 'Pengenalan AI', lessons: [
        { title: 'Apa itu Kecerdasan Buatan?', type: 'TEXT', durationMin: 12, content: '## Apa itu AI?\n\nKecerdasan Buatan (AI) merujuk kepada keupayaan mesin untuk meniru kecerdasan manusia seperti menaaf, memahami bahasa, dan membuat keputusan.\n\n**Contoh harian:**\n- Cadangan auto-tamat pada e-mel\n- Penapis spam\n- Carian Google\n- Pembantu suara (Siri, Alexa)\n\nAI bukan sihir - ia adalah matematik, data dan pengaturcaraan yang disusun untuk menyelesaikan masalah tertentu.' },
        { title: 'Sejarah Ringkas AI', type: 'VIDEO', durationMin: 10, content: 'https://example.com/videos/ai-history' },
        { title: 'Mitos dan Realiti AI', type: 'TEXT', durationMin: 14, content: '## Mitos vs Realiti\n\n| Mitos | Realiti |\n|------|--------|\n| AI akan gantikan semua kerja | AI mengubah cara kerja, banyak tugas baru tercipta |\n| AI sentiasa betul | AI boleh silap dan halusinasi |\n| AI mempunyai perasaan | AI hanya memproses data |\n| AI terlalu mahal | Banyak alat AI percuma atau murah |' },
      ]},
      { title: 'Jenis AI', lessons: [
        { title: 'AI Sempit vs Umum', type: 'TEXT', durationMin: 12, content: '## AI Sempit (Narrow AI)\nDireka untuk satu tugas: contoh penapis spam, pengenalan wajah.\n\n## AI Umum (AGI)\nMasih teori - keupayaan setara manusia merentas semua tugas.\n\nSemua AI hari ini adalah AI sempit, walaupun chatbot seperti ChatGPT kelihatan umum.' },
        { title: 'AI Generatif', type: 'VIDEO', durationMin: 15, content: 'https://example.com/videos/gen-ai' },
        { title: 'Pembelajaran Mesin Asas', type: 'PDF', durationMin: 12, content: 'https://example.com/pdfs/ml-basics.pdf' },
      ]},
      { title: 'AI di Malaysia', lessons: [
        { title: 'Kegunaan AI di Malaysia', type: 'TEXT', durationMin: 13, content: '## Contoh kegunaan\n\n- **MyDigital**: inisiatif kerajaan untuk ekonomi digital\n- **JPJ**: sistem pengecaman plat nombor\n- **Hospital**: bantuan diagnosis imej\n- **Bank**: pengesanan penipuan\n- **e-Dagang**: cadangan produk\n\nMalaysia menyasarkan menjadi hab AI ASEAN menjelang 2030.' },
        { title: 'Makmal: Cuba Chatbot', type: 'LAB', durationMin: 20, content: JSON.stringify({ prompt: 'Tuliskan e-mel jemputan mesyuarat dalam Bahasa Malaysia', scenario: 'Anda akan mencuba simulasi chatbot AI. Taip prompt anda dan lihat respons simulasi.' }) },
      ]},
    ],
    quiz: { title: 'Kuiz Asas AI', timeLimitMin: 15, maxAttempts: 3, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'Apakah definasi utama Kecerdasan Buatan?', options: ['Mesin yang boleh meniru kecerdasan manusia', 'Robot yang berjalan seperti manusia', 'Program yang hanya membuat kira-kira', 'Alat untuk internet'], correctAnswer: '0', explanation: 'AI adalah keupayaan mesin meniru kecerdasan manusia.' },
      { type: 'MULTIPLE_CHOICE', text: 'Yang manakah CONTOH AI sempit?', options: ['Robot seperti manusia', 'Penapis spam e-mel', 'Kereta terbang', 'Mesin taip'], correctAnswer: '1' },
      { type: 'TRUE_FALSE', text: 'AI generatif boleh mencipta teks, gambar dan kod.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'AI Umum (AGI) wujud hari ini?', options: ['Ya, di semua tempat', 'Tidak, masih teori', 'Hanya di Amerika', 'Hanya di Jepun'], correctAnswer: '1' },
      { type: 'SHORT_ANSWER', text: 'Nyatakan satu contoh kegunaan AI di Malaysia.', options: [], correctAnswer: 'jpj' },
      { type: 'TRUE_FALSE', text: 'AI sentiasa memberikan jawapan yang betul.', options: ['Betul', 'Salah'], correctAnswer: 'false', explanation: 'AI boleh halusinasi dan membuat kesilapan.' },
      { type: 'MULTIPLE_CHOICE', text: 'Apakah komponen utama Pembelajaran Mesin?', options: ['Hanya kod', 'Data, model, latihan', 'Hanya komputer mahal', 'Hanya internet'], correctAnswer: '1' },
      { type: 'MULTIPLE_CHOICE', text: 'MyDigital adalah inisiatif negara untuk?', options: ['Ekonomi digital', 'Pertanian', 'Pelancongan sahaja', 'Sukan'], correctAnswer: '0' },
    ]},
  },
  {
    code: 'AI-102', title: 'Kejuruteraan Prompt', level: 'PEMULA', catIdx: 1, durationHours: 5, language: 'ms', status: 'PUBLISHED',
    desc: 'Kemahiran menulis prompt berkesan untuk mendapatkan output terbaik daripada model AI generatif.',
    outcomes: ['Menguasai struktur prompt yang berkesan', 'Memahami peranan, konteks dan format output', 'Mengaplikasikan teknik langkah demi langkah', 'Menulis prompt dalam BM dan EN'],
    syllabus: ['Anatomi prompt', 'Peranan dan persona', 'Konteks dan kekangan', 'Format output', 'Teknik chain-of-thought'],
    modules: [
      { title: 'Asas Prompt', lessons: [
        { title: 'Anatomi Prompt', type: 'TEXT', durationMin: 14, content: '## Anatomi Prompt Berkesan\n\nPrompt yang baik mengandungi:\n1. **Peranan** - siapa AI tersebut\n2. **Tugas** - apa yang perlu dibuat\n3. **Konteks** - maklumat latar\n4. **Format** - bagaimana output\n5. **Kekangan** - had dan syarat\n\nContoh:\n> "Anda ialah jurutera perisian. Tulis fungsi TypeScript untuk mengira bilangan hari antara dua tarikh. Berikan ulasan dalam Bahasa Malaysia. Hadkan kepada 20 baris."' },
        { title: 'Peranan dan Persona', type: 'VIDEO', durationMin: 12, content: 'https://example.com/videos/persona' },
        { title: 'Konteks dan Kekangan', type: 'TEXT', durationMin: 13, content: '## Berikan Konteks\n\nTanpa konteks, output AI menjadi umum dan kurang berguna.\n\n**Tip:**\n- Nyatakan audiens\n- Nyatakan tahap butiran\n- Nyatakan panjang maksimum' },
      ]},
      { title: 'Teknik Lanjutan', lessons: [
        { title: 'Chain-of-Thought', type: 'TEXT', durationMin: 15, content: '## Chain-of-Thought\n\nMinta AI berfikir langkah demi langkah untuk tugas kompleks.\n\nContoh: "Selesaikan masalah ini langkah demi langkah, tunjukkan setiap langkah, kemudian berikan jawapan akhir."' },
        { title: 'Format Output', type: 'LAB', durationMin: 20, content: JSON.stringify({ prompt: 'Jana jadual HTML 3 lajur: nama, jawatan, gaji', scenario: 'Cuba kawal format output dengan prompt.' }) },
        { title: 'Contoh Prompt dalam BM', type: 'PDF', durationMin: 10, content: 'https://example.com/pdfs/bm-prompts.pdf' },
      ]},
    ],
    quiz: { title: 'Kuiz Prompt', timeLimitMin: 12, maxAttempts: 3, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'Apakah 5 komponen utama prompt berkesan?', options: ['Peranan, Tugas, Konteks, Format, Kekangan', 'Hanya soalan', 'Hanya tajuk', 'Hanya jawapan'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'Menentukan peranan AI membantu menghasilkan output yang lebih relevan.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Chain-of-thought berguna untuk?', options: ['Tugas mudah', 'Tugas kompleks langkah demi langkah', 'Hanya gambar', 'Hanya muzik'], correctAnswer: '1' },
      { type: 'SHORT_ANSWER', text: 'Berikan satu teknik untuk mengawal format output.', options: [], correctAnswer: 'format' },
      { type: 'MULTIPLE_CHOICE', text: 'Konteks dalam prompt merujuk kepada?', options: ['Harga AI', 'Maklumat latar yang membantu AI', 'Komputer yang digunakan', 'Bahasa pengaturcaraan'], correctAnswer: '1' },
      { type: 'TRUE_FALSE', text: 'Prompt yang panjang sentiasa lebih baik.', options: ['Betul', 'Salah'], correctAnswer: 'false' },
    ]},
  },
  {
    code: 'AI-103', title: 'AI Generatif untuk Kerja Harian', level: 'PEMULA', catIdx: 0, durationHours: 4, language: 'ms', status: 'PUBLISHED',
    desc: 'Penggunaan praktikal AI generatif untuk tugas harian pejabat: e-mel, ringkasan, terjemahan, penyelidikan.',
    outcomes: ['Menulis e-mel dengan bantuan AI', 'Meringkaskan dokumen panjang', 'Menterjemah dengan tepat', 'Menjana idea kreatif'],
    syllabus: ['E-mel & surat', 'Ringkasan dokumen', 'Terjemahan', 'Penyelidikan', 'Penjanaan idea'],
    modules: [
      { title: 'Penulisan', lessons: [
        { title: 'E-mel Profesional', type: 'TEXT', durationMin: 13, content: '## E-mel dengan AI\n\nPrompt contoh:\n> "Tulis e-mel jemputan kepada 30 staf untuk sesi latihan AI pada 20hb di dewan utama, jam 9 pagi. Gunakan nada profesional tetapi mesra."' },
        { title: 'Ringkasan Mesyuarat', type: 'VIDEO', durationMin: 12, content: 'https://example.com/videos/summarize' },
        { title: 'Makmal: Ringkasan', type: 'LAB', durationMin: 18, content: JSON.stringify({ prompt: 'Ringkaskan teks berikut dalam 3 point utama', scenario: 'Tempel nota mesyuarat dan minta ringkasan.' }) },
      ]},
      { title: 'Penyelidikan & Idea', lessons: [
        { title: 'Terjemahan AI', type: 'TEXT', durationMin: 11, content: '## Terjemahan\n\nAI boleh menterjemah sambil mengekalkan konteks budaya.\n\n**Tip:** Nyatakan tujuan terjemahan (formal/kasual).' },
        { title: 'Penjanaan Idea', type: 'PDF', durationMin: 12, content: 'https://example.com/pdfs/ideation.pdf' },
      ]},
    ],
    quiz: { title: 'Kuiz AI Kerja Harian', timeLimitMin: 10, maxAttempts: 2, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'Apakah kegunaan utama AI dalam penulisan e-mel?', options: ['Menggantikan semua pekerja', 'Menjana draf e-mel berpandukan titik utama', 'Memadam e-mel', 'Hanya terjemah'], correctAnswer: '1' },
      { type: 'TRUE_FALSE', text: 'AI boleh meringkaskan dokumen panjang dengan cepat.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Untuk terjemahan yang baik, anda perlu nyatakan?', options: ['Tujuan dan nada', 'Hanya harga', 'Hanya tarikh', 'Hanya alamat'], correctAnswer: '0' },
      { type: 'SHORT_ANSWER', text: 'Nyatakan satu tugas harian yang boleh dibantu AI.', options: [], correctAnswer: 'e-mel' },
      { type: 'MULTIPLE_CHOICE', text: 'Apakah risiko menggunakan AI untuk penyelidikan?', options: ['Maklumat palsu/halusinasi', 'Tiada risiko langsung', 'Komputer rosak', 'Internet terputus'], correctAnswer: '0' },
    ]},
  },
  {
    code: 'AI-201', title: 'Analisis Data dengan Bantuan AI', level: 'PERTENGAHAN', catIdx: 2, durationHours: 6, language: 'ms', status: 'PUBLISHED',
    desc: 'Pembersihan data, formula Excel dibantu AI, visualisasi dan tafsiran keputusan.',
    outcomes: ['Membersihkan data dengan AI', 'Membina formula Excel dibantu AI', 'Memilih visualisasi sesuai', ' mentafsir keputusan dengan kritis'],
    syllabus: ['Pembersihan data', 'Formula Excel', 'Visualisasi', 'Tafsiran'],
    modules: [
      { title: 'Persediaan Data', lessons: [
        { title: 'Pembersihan Data', type: 'TEXT', durationMin: 15, content: '## Pembersihan Data\n\nLangkah biasa:\n1. Buang pendua\n2. Isi nilai kosong\n3. Betulkan format\n4. Tukar jenis data' },
        { title: 'Excel dengan AI', type: 'VIDEO', durationMin: 14, content: 'https://example.com/videos/excel-ai' },
      ]},
      { title: 'Visualisasi', lessons: [
        { title: 'Memilih Carta', type: 'TEXT', durationMin: 12, content: '## Panduan Carta\n\n- **Bar**: perbandingan kategori\n- **Garis**: trend masa\n- **Pie**: bahagian keseluruhan\n- **Serakan**: hubungan dua pembolehubah' },
        { title: 'Makmal Analisis', type: 'LAB', durationMin: 25, content: JSON.stringify({ prompt: 'Cadangkan carta terbaik untuk data jualan bulanan 12 bulan', scenario: 'Latih minta AI mencadangkan visualisasi.' }) },
      ]},
    ],
    quiz: { title: 'Kuiz Analisis Data', timeLimitMin: 18, maxAttempts: 3, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'Langkah pertama dalam pembersihan data?', options: ['Buang pendua', 'Buat graf', 'Cetak laporan', 'Hantar kepada bos'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'Carta garis sesuai untuk menunjukkan trend masa.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Carta pie paling sesuai untuk?', options: ['Trend masa', 'Bahagian keseluruhan', 'Hubungan dua pembolehubah', 'Perbandingan kategori'], correctAnswer: '1' },
      { type: 'MULTIPLE_CHOICE', text: 'AI boleh membantu Excel dengan?', options: ['Menjana formula', 'Memadam fail', 'Mematikan komputer', 'Tiada'], correctAnswer: '0' },
      { type: 'SHORT_ANSWER', text: 'Apakah risiko utama tafsiran data AI?', options: [], correctAnswer: 'bias' },
      { type: 'TRUE_FALSE', text: 'Visualisasi yang baik membantu membuat keputusan.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Langkah selepas pembersihan data?', options: ['Analisis dan visualisasi', 'Padam data', 'Tutup komputer', 'Hantar WhatsApp'], correctAnswer: '0' },
    ]},
  },
  {
    code: 'AI-202', title: 'Automasi Kerja dan Aliran Kerja AI', level: 'PERTENGAHAN', catIdx: 2, durationHours: 6, language: 'ms', status: 'PUBLISHED',
    desc: 'Mengenal pasti tugas berulang, alat tanpa kod, ejen AI dan pengukuran penjimatan masa.',
    outcomes: ['Mengenal pasti tugas berulang', 'Memilih alat automasi tanpa kod', 'Memahami ejen AI', 'Mengukur penjimatan masa'],
    syllabus: ['Tugas berulang', 'Alat tanpa kod', 'Ejen AI', 'Pengukuran'],
    modules: [
      { title: 'Asas Automasi', lessons: [
        { title: 'Mengenal Pasti Tugas Berulang', type: 'TEXT', durationMin: 14, content: '## Tugas Berulang\n\nCari tugas yang:\n- Berulang setiap hari/minggu\n- Mempunyai langkah tetap\n- Mengambil masa banyak\n- Mudah tersilap jika dibuat manual' },
        { title: 'Alat Tanpa Kod', type: 'VIDEO', durationMin: 13, content: 'https://example.com/videos/nocode' },
      ]},
      { title: 'Ejen AI', lessons: [
        { title: 'Pengenalan Ejen AI', type: 'TEXT', durationMin: 15, content: '## Ejen AI\n\nEjen AI boleh:\n- Membuat keputusan\n- Mengambil tindakan\n- Berinteraksi dengan alat lain\n- Belajar daripada maklum balas' },
        { title: 'Mengukur Penjimatan Masa', type: 'PDF', durationMin: 12, content: 'https://example.com/pdfs/roi.pdf' },
      ]},
    ],
    quiz: { title: 'Kuiz Automasi', timeLimitMin: 15, maxAttempts: 3, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'Tugas yang sesuai diautomasi ialah?', options: ['Tugas berulang dengan langkah tetap', 'Tugas kreatif sekali sahaja', 'Tugas memerlukan empati manusia', 'Mesyuarat strategik'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'Ejen AI boleh mengambil tindakan tanpa interaksi manusia.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Alat tanpa kod bermaksud?', options: ['Tiada kod diperlukan untuk membina', 'Tiada komputer', 'Tiada internet', 'Tiada kos'], correctAnswer: '0' },
      { type: 'SHORT_ANSWER', text: 'Bagaimana mengukur kejayaan automasi?', options: [], correctAnswer: 'masa' },
      { type: 'MULTIPLE_CHOICE', text: 'Risiko automasi ialah?', options: ['Kualiti turun jika tidak dipantau', 'Tiada risiko', 'Internet putus', 'Komputer rosak'], correctAnswer: '0' },
    ]},
  },
  {
    code: 'AI-203', title: 'AI untuk Khidmat Pelanggan', level: 'PERTENGAHAN', catIdx: 0, durationHours: 4, language: 'ms', status: 'PUBLISHED',
    desc: 'Chatbot, templat balasan, analisis sentimen dan kawalan kualiti untuk pasukan khidmat pelanggan.',
    outcomes: ['Membina chatbot asas', 'Menyediakan templat balasan', 'Menganalisis sentimen', 'Memantau kualiti'],
    syllabus: ['Chatbot', 'Templat balasan', 'Analisis sentimen', 'Kawalan kualiti'],
    modules: [
      { title: 'Chatbot Asas', lessons: [
        { title: 'Pengenalan Chatbot', type: 'TEXT', durationMin: 13, content: '## Chatbot\n\nChatbot membantu:\n- Menjawab soalan lazim\n- Mengutip maklumat awal\n- Menghala ke ejen manusia bila perlu' },
        { title: 'Templat Balasan', type: 'VIDEO', durationMin: 11, content: 'https://example.com/videos/templates' },
      ]},
      { title: 'Sentimen & Kualiti', lessons: [
        { title: 'Analisis Sentimen', type: 'TEXT', durationMin: 14, content: '## Sentimen\n\nAI boleh mengesan emosi dalam teks: positif, neutral, negatif. Membantu pasukan tindak balas cepat.' },
        { title: 'Kawalan Kualiti', type: 'LAB', durationMin: 18, content: JSON.stringify({ prompt: 'Analisis sentimen mesej pelanggan ini', scenario: 'Latih analisis sentimen.' }) },
      ]},
    ],
    quiz: { title: 'Kuiz Khidmat Pelanggan AI', timeLimitMin: 12, maxAttempts: 2, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'Chatbot paling sesuai untuk?', options: ['Soalan lazim', 'Keputusan strategik', 'Perbualan peribadi', 'Mesyuarat lembaga'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'Analisis sentimen mengesan emosi dalam teks.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Templat balasan membantu?', options: ['Konsistensi dan kelajuan', 'Memadam e-mel', 'Menggantikan semua ejen', 'Tiada'], correctAnswer: '0' },
      { type: 'SHORT_ANSWER', text: 'Berikan satu manfaat chatbot.', options: [], correctAnswer: 'kelajuan' },
    ]},
  },
  {
    code: 'AI-301', title: 'Etika, Privasi dan Tadbir Urus AI', level: 'SEMUA', catIdx: 3, durationHours: 3, language: 'ms', status: 'PUBLISHED',
    desc: 'PDPA 2010, kerahsiaan data, bias, halusinasi dan dasar penggunaan AI organisasi.',
    outcomes: ['Memahami PDPA 2010', 'Mengenal pasti bias AI', 'Memahami halusinasi', 'Mengamalkan dasar organisasi'],
    syllabus: ['PDPA 2010', 'Bias AI', 'Halusinasi', 'Dasar organisasi'],
    modules: [
      { title: 'PDPA 2010', lessons: [
        { title: 'Asas PDPA 2010', type: 'TEXT', durationMin: 16, content: '## PDPA 2010\n\nAkta Perlindungan Data Peribadi 2010 mengawal pemprosesan data peribadi di Malaysia.\n\n**Prinsip utama:**\n- Notis dan persetujuan\n- Tujuan dinyatakan\n- Pengumpulan minimum\n- Keselamatan\n- Pengekalan terhad\n- Akses dan pembetulan' },
        { title: 'Data Peribadi vs Sensitif', type: 'VIDEO', durationMin: 10, content: 'https://example.com/videos/pdpa' },
      ]},
      { title: 'Bias & Halusinasi', lessons: [
        { title: 'Bias dalam AI', type: 'TEXT', durationMin: 14, content: '## Bias\n\nAI mewarisi bias daripada data latihan. Contoh: bias jantina, kaum, bahasa.\n\n**Mitigasi:** data pelbagai, semakan manusia, penilaian berkala.' },
        { title: 'Halusinasi', type: 'PDF', durationMin: 10, content: 'https://example.com/pdfs/hallucination.pdf' },
      ]},
    ],
    quiz: { title: 'Kuiz Etika AI', timeLimitMin: 15, maxAttempts: 3, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'PDPA 2010 mengawal?', options: ['Pemprosesan data peribadi', 'Pemanduan kereta', 'Cukai pendapatan', 'Pelancongan'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'Bias AI datang daripada data latihan.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Halusinasi AI bermaksud?', options: ['AI menghasilkan maklumat palsu', 'AI tidur', 'AI rosak', 'AI terlalu cepat'], correctAnswer: '0' },
      { type: 'SHORT_ANSWER', text: 'Nyatakan satu prinsip PDPA.', options: [], correctAnswer: 'persetujuan' },
      { type: 'TRUE_FALSE', text: 'Data peribadi tidak boleh dikongsi tanpa persetujuan.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Untuk mengurangkan bias, kita perlu?', options: ['Data pelbagai dan semakan manusia', 'Tiada langkah', 'Padam semua data', 'Ganti AI dengan komputer lama'], correctAnswer: '0' },
      { type: 'MULTIPLE_CHOICE', text: 'Pengumpulan data minimum bermaksud?', options: ['Hanya kumpul data yang perlu', 'Kumpul semua data', 'Tiada data langsung', 'Beli data'], correctAnswer: '0' },
    ]},
  },
  {
    code: 'AI-302', title: 'Keselamatan Penggunaan AI', level: 'SEMUA', catIdx: 3, durationHours: 3, language: 'ms', status: 'PUBLISHED',
    desc: 'Kebocoran data, prompt injection, phishing dibantu AI dan amalan terbaik keselamatan.',
    outcomes: ['Mengenal pasti kebocoran data', 'Memahami prompt injection', 'Mengesan phishing AI', 'Mengamalkan keselamatan'],
    syllabus: ['Kebocoran data', 'Prompt injection', 'Phishing', 'Amalan terbaik'],
    modules: [
      { title: 'Ancaman', lessons: [
        { title: 'Kebocoran Data', type: 'TEXT', durationMin: 14, content: '## Kebocoran Data\n\nJangan masukkan data sulit ke dalam alat AI awam. Data yang dimasukkan boleh disimpan atau dilatih semula.' },
        { title: 'Prompt Injection', type: 'VIDEO', durationMin: 12, content: 'https://example.com/videos/injection' },
      ]},
      { title: 'Amalan Terbaik', lessons: [
        { title: 'Phishing AI', type: 'TEXT', durationMin: 13, content: '## Phishing AI\n\nPenjenayah guna AI untuk menulis e-mel phishing yang lebih meyakinkan. Sentiasa sahkan pautan dan penghantar.' },
        { title: 'Senarai Semak Keselamatan', type: 'PDF', durationMin: 11, content: 'https://example.com/pdfs/security.pdf' },
      ]},
    ],
    quiz: { title: 'Kuiz Keselamatan AI', timeLimitMin: 12, maxAttempts: 3, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'Apakah risiko memasukkan data sulit ke AI awam?', options: ['Kebocoran data', 'Tiada risiko', 'Komputer rosak', 'Internet terputus'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'Prompt injection cuba memanipulasi tingkah laku AI.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Phishing dibantu AI lebih?', options: ['Meyakinkan dan tersusun', 'Lebih bodoh', 'Tiada perbezaan', 'Hanya dalam Bahasa Inggeris'], correctAnswer: '0' },
      { type: 'SHORT_ANSWER', text: 'Nyatakan satu amalan keselamatan.', options: [], correctAnswer: 'sahkan' },
      { type: 'TRUE_FALSE', text: 'Sentiasa sahkan pautan sebelum klik.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
    ]},
  },
  {
    code: 'AI-401', title: 'Membina Aplikasi AI (Pengenalan untuk Pembangun)', level: 'LANJUTAN', catIdx: 4, durationHours: 8, language: 'ms', status: 'PUBLISHED',
    desc: 'API model bahasa, RAG asas, penilaian output, kos dan prestasi.',
    outcomes: ['Memanggil API model bahasa', 'Memahami RAG asas', 'Menilai output', 'Menganggar kos dan prestasi'],
    syllabus: ['API LLM', 'RAG', 'Penilaian', 'Kos & prestasi'],
    modules: [
      { title: 'API LLM', lessons: [
        { title: 'Panggilan API', type: 'TEXT', durationMin: 18, content: '## API LLM\n\nContoh panggilan:\n```ts\nconst res = await fetch("https://api.example.com/v1/chat", {\n  method: "POST",\n  headers: { Authorization: `Bearer ${KEY}` },\n  body: JSON.stringify({ messages: [{role:"user", content:"Halo"}] })\n})\n```' },
        { title: 'Pengurusan Token', type: 'VIDEO', durationMin: 14, content: 'https://example.com/videos/tokens' },
      ]},
      { title: 'RAG', lessons: [
        { title: 'Pengenalan RAG', type: 'TEXT', durationMin: 16, content: '## RAG (Retrieval Augmented Generation)\n\n1. Index dokumen\n2. Cari dokumen relevan\n3. Hantar konteks kepada LLM\n4. Jana jawapan' },
        { title: 'Penilaian Output', type: 'LAB', durationMin: 25, content: JSON.stringify({ prompt: 'Bandingkan dua output LLM dari segi ketepatan', scenario: 'Latih penilaian.' }) },
      ]},
    ],
    quiz: { title: 'Kuiz Pembangun AI', timeLimitMin: 20, maxAttempts: 3, passMark: 70, questions: [
      { type: 'MULTIPLE_CHOICE', text: 'API LLM biasanya menerima?', options: ['Mesej dalam format JSON', 'Fail audio sahaja', 'Nombor telefon', 'Gambar sahaja'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'RAG membantu LLM menjawab dengan maklumat terkini dan khusus.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
      { type: 'MULTIPLE_CHOICE', text: 'Token dalam LLM ialah?', options: ['Cebisan teks yang dikenakan bayaran', 'Mata wang kripto', 'Nama pengguna', 'Jenis komputer'], correctAnswer: '0' },
      { type: 'SHORT_ANSWER', text: 'Nyatakan satu metrik penilaian output.', options: [], correctAnswer: 'ketepatan' },
      { type: 'MULTIPLE_CHOICE', text: 'Untuk mengurangkan kos API, kita boleh?', options: ['Cache jawapan biasa dan kurangkan token', 'Tiada cara', 'Beli komputer lebih cepat', 'Padam internet'], correctAnswer: '0' },
      { type: 'TRUE_FALSE', text: 'Penilaian output penting untuk aplikasi pengeluaran.', options: ['Betul', 'Salah'], correctAnswer: 'true' },
    ]},
  },
]

async function main() {
  console.log('Resetting database...')
  await db.auditLog.deleteMany()
  await db.notification.deleteMany()
  await db.certificate.deleteMany()
  await db.attendanceCorrection.deleteMany()
  await db.attendance.deleteMany()
  await db.session.deleteMany()
  await db.quizAttempt.deleteMany()
  await db.question.deleteMany()
  await db.quiz.deleteMany()
  await db.lessonProgress.deleteMany()
  await db.lesson.deleteMany()
  await db.module.deleteMany()
  await db.enrollment.deleteMany()
  await db.course.deleteMany()
  await db.category.deleteMany()
  await db.user.deleteMany()
  await db.department.deleteMany()

  console.log('Creating departments...')
  const deptMap: Record<string, string> = {}
  for (const d of DEPARTMENTS) {
    const dept = await db.department.create({ data: { code: d.code, name: d.name } })
    deptMap[d.code] = dept.id
  }

  console.log('Creating categories...')
  const catMap: Record<string, string> = {}
  for (const c of CATEGORIES) {
    const cat = await db.category.create({ data: { name: c.name, description: c.description } })
    catMap[c.name] = cat.id
  }

  console.log('Creating users (40)...')
  const roles: ('ADMIN' | 'HR' | 'TRAINER' | 'STAFF')[] = ['ADMIN', 'HR', 'HR', 'TRAINER', 'TRAINER', 'TRAINER', 'TRAINER', ...Array(33).fill('STAFF') as 'STAFF'[]]
  const colors = ['#0d9488', '#0891b2', '#7c3aed', '#db2777', '#ea580c', '#16a34a']
  const users: { id: string; staffNo: string; name: string; email: string; role: string; deptCode: string }[] = []
  for (let i = 0; i < 40; i++) {
    const staffNo = `A${1000 + i}`
    const name = pickName(i)
    const role = roles[i]
    const deptCode = role === 'TRAINER' ? 'TRAIN' : role === 'ADMIN' ? 'IT' : role === 'HR' ? 'HR' : DEPARTMENTS[i % DEPARTMENTS.length].code
    const email = `user${1000 + i}@alaamin.my`
    const u = await db.user.create({
      data: {
        staffNo,
        name,
        email,
        passwordHash: 'demo123',
        role: role as any,
        departmentId: deptMap[deptCode],
        position: role === 'ADMIN' ? 'Pentadbir Sistem' : role === 'HR' ? 'Pengurus HR' : role === 'TRAINER' ? 'Jurulatih' : 'Staf',
        language: 'ms',
        status: 'ACTIVE',
        avatarColor: colors[i % colors.length],
      }
    })
    users.push({ id: u.id, staffNo, name, email, role, deptCode })
  }

  // set department heads
  const hrUser = users.find(u => u.role === 'HR')
  if (hrUser) await db.department.update({ where: { code: 'HR' }, data: { headUserId: hrUser.id } })

  console.log('Creating courses (9) with modules, lessons, quizzes...')
  const trainers = users.filter(u => u.role === 'TRAINER')
  const courseIds: string[] = []
  for (let i = 0; i < COURSES.length; i++) {
    const c = COURSES[i]
    const cat = CATEGORIES[c.catIdx]
    const instructor = trainers[i % trainers.length]
    const course = await db.course.create({
      data: {
        code: c.code,
        title: c.title,
        description: c.desc,
        categoryId: catMap[cat.name],
        level: c.level as any,
        language: c.language,
        durationHours: c.durationHours,
        instructorId: instructor?.id,
        status: c.status as any,
        passMark: c.quiz.passMark,
        minAttendancePct: 0,
        thumbnail: null,
        outcomes: c.outcomes.join('\n'),
        syllabus: c.syllabus.join('\n'),
      }
    })
    courseIds.push(course.id)

    for (let mi = 0; mi < c.modules.length; mi++) {
      const m = c.modules[mi]
      const mod = await db.module.create({ data: { courseId: course.id, title: m.title, order: mi + 1 } })
      for (let li = 0; li < m.lessons.length; li++) {
        const l = m.lessons[li]
        await db.lesson.create({ data: { moduleId: mod.id, title: l.title, type: l.type as any, content: l.content, durationMin: l.durationMin, order: li + 1 } })
      }
    }

    const q = c.quiz
    const quiz = await db.quiz.create({ data: { courseId: course.id, title: q.title, timeLimitMin: q.timeLimitMin, maxAttempts: q.maxAttempts, passMark: q.passMark } })
    for (let qi = 0; qi < q.questions.length; qi++) {
      const qq = q.questions[qi]
      await db.question.create({
        data: {
          quizId: quiz.id,
          type: qq.type as any,
          text: qq.text,
          options: JSON.stringify(qq.options),
          correctAnswer: qq.correctAnswer,
          explanation: qq.explanation || null,
          points: 1,
          order: qi + 1,
        }
      })
    }
  }

  console.log('Creating enrollments (150+) with progress...')
  const staffUsers = users.filter(u => u.role === 'STAFF')
  const hrUsers = users.filter(u => u.role === 'HR')
  let enrollCount = 0
  for (const course of courseIds) {
    // Each course: enroll 15-20 random staff
    const n = 15 + Math.floor(Math.random() * 6)
    const shuffled = [...staffUsers].sort(() => Math.random() - 0.5).slice(0, n)
    for (const su of shuffled) {
      const progress = Math.random() < 0.5 ? Math.floor(Math.random() * 100) : 100
      const completedAt = progress === 100 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000) : null
      const assigner = hrUsers[Math.floor(Math.random() * hrUsers.length)]
      await db.enrollment.create({
        data: {
          userId: su.id,
          courseId: course,
          assignedBy: assigner?.id,
          status: progress === 100 ? 'COMPLETED' : progress === 0 ? 'NOT_STARTED' : 'IN_PROGRESS',
          progressPct: progress,
          completedAt,
          dueDate: new Date(Date.now() + 30 * 86400000),
        }
      })
      enrollCount++
    }
  }
  console.log(`Enrollments created: ${enrollCount}`)

  console.log('Creating sessions (24) and attendance (600+)...')
  const now = new Date()
  const sessionIds: { id: string; date: Date; startTime: string; lateAfterMin: number; trainerId?: string }[] = []
  for (let i = 0; i < 24; i++) {
    const offset = (i - 8) * 1 // spread across past/today/future
    const d = new Date(now)
    d.setDate(d.getDate() + offset)
    const courseId = courseIds[i % courseIds.length]
    const startHour = 9 + (i % 4) * 2
    const trainer = trainers[i % trainers.length]
    const code6 = String(100000 + Math.floor(Math.random() * 900000))
    const qrToken = randomUUID()
    const codeExpiry = new Date(d.getTime() + 60 * 60 * 1000)
    const sess = await db.session.create({
      data: {
        courseId,
        title: `Sesi ${COURSES[i % COURSES.length].code} - ${d.toLocaleDateString('ms-MY')}`,
        date: d,
        startTime: `${String(startHour).padStart(2, '0')}:00`,
        endTime: `${String(startHour + 3).padStart(2, '0')}:00`,
        mode: i % 3 === 0 ? 'DALAM_TALIAN' : 'BERSEMUKA',
        location: i % 3 === 0 ? null : ['Dewan Utama', 'Bilik Latihan 1', 'Bilik Latihan 2', 'Dewan Serbaguna'][i % 4],
        url: i % 3 === 0 ? 'https://meet.example.com/session' : null,
        capacity: 40,
        qrToken,
        code6,
        codeExpiry,
        lateAfterMin: 15,
        trainerId: trainer?.id,
      }
    })
    sessionIds.push({ id: sess.id, date: d, startTime: `${String(startHour).padStart(2, '0')}:00`, lateAfterMin: 15, trainerId: trainer?.id })
  }

  // For each session, create attendance for ~25 staff (past + today sessions)
  let attCount = 0
  const statuses: ('HADIR' | 'LEWAT' | 'TIDAK_HADIR' | 'CUTI' | 'DIKECUALIKAN')[] = ['HADIR', 'HADIR', 'HADIR', 'HADIR', 'HADIR', 'HADIR', 'LEWAT', 'TIDAK_HADIR', 'CUTI', 'DIKECUALIKAN']
  for (let si = 0; si < sessionIds.length; si++) {
    const s = sessionIds[si]
    const isPast = s.date.getTime() < now.getTime()
    if (!isPast) continue // future sessions: no attendance yet
    const n = 25 + Math.floor(Math.random() * 10)
    const shuffled = [...staffUsers].sort(() => Math.random() - 0.5).slice(0, n)
    for (const su of shuffled) {
      const st = statuses[Math.floor(Math.random() * statuses.length)]
      const [sh, sm] = s.startTime.split(':').map(Number)
      const checkIn = new Date(s.date)
      checkIn.setHours(sh, sm + Math.floor(Math.random() * 30), 0, 0)
      const checkOut = new Date(s.date)
      checkOut.setHours(sh + 3, 0, 0, 0)
      const method = ['QR', 'CODE', 'MANUAL', 'IMPORT', 'AUTO'][Math.floor(Math.random() * 5)] as any
      await db.attendance.create({
        data: {
          sessionId: s.id,
          userId: su.id,
          status: st as any,
          checkInAt: (st === 'HADIR' || st === 'LEWAT') ? checkIn : null,
          checkOutAt: st === 'HADIR' || st === 'LEWAT' ? checkOut : null,
          method,
          recordedById: s.trainerId,
          remarks: st === 'CUTI' ? 'Cuti tahunan' : st === 'DIKECUALIKAN' ? 'Tugas rasmi' : null,
        }
      })
      attCount++
    }
  }
  console.log(`Attendance created: ${attCount}`)

  console.log('Creating certificates (30)...')
  const completedEnrollments = await db.enrollment.findMany({ where: { status: 'COMPLETED' }, take: 30 })
  let certCount = 0
  for (const e of completedEnrollments) {
    const certNo = `LMS-AA-${String(2026000 + certCount)}`
    const verifyCode = randomUUID().slice(0, 8).toUpperCase()
    await db.certificate.create({
      data: {
        userId: e.userId,
        courseId: e.courseId,
        certNo,
        issuedAt: e.completedAt || new Date(),
        expiresAt: new Date(Date.now() + 365 * 86400000),
        verifyCode,
      }
    })
    certCount++
    // notify
    await db.notification.create({
      data: { userId: e.userId, type: 'certificate', message: `Sijil baru dikeluarkan (${certNo})`, read: Math.random() < 0.5 }
    })
  }
  console.log(`Certificates created: ${certCount}`)

  console.log('Creating notifications for upcoming sessions...')
  for (let i = 0; i < sessionIds.length; i++) {
    const s = sessionIds[i]
    if (s.date.getTime() > now.getTime()) {
      // notify assigned staff
      const shuffled = [...staffUsers].slice(0, 10)
      for (const su of shuffled) {
        await db.notification.create({
          data: { userId: su.id, type: 'session', message: `Sesi latihan akan datang pada ${s.date.toLocaleDateString('ms-MY')}`, read: false }
        })
      }
    }
  }

  console.log('Creating audit logs...')
  const adminUser = users.find(u => u.role === 'ADMIN')
  await db.auditLog.createMany({
    data: [
      { userId: adminUser?.id, action: 'SEED', entity: 'system', entityId: 'all', after: 'Dummy data seeded', timestamp: new Date() },
      { userId: adminUser?.id, action: 'CREATE', entity: 'user', entityId: users[0].id, after: users[0].name, timestamp: new Date() },
      { userId: adminUser?.id, action: 'CREATE', entity: 'course', entityId: courseIds[0], after: COURSES[0].title, timestamp: new Date() },
    ]
  })

  console.log('\n=== SEED COMPLETE ===')
  console.log('Demo accounts (password: demo123):')
  console.log('  Admin     : admin@alaamin.my')
  console.log('  HR        : (any hr user, e.g. check db)')
  console.log('  Trainer   : (any trainer user)')
  console.log('  Staff     : (any staff user)')
  const admin = users.find(u => u.role === 'ADMIN')
  const hr = users.find(u => u.role === 'HR')
  const trainer = users.find(u => u.role === 'TRAINER')
  const staff = users.find(u => u.role === 'STAFF')
  if (admin) console.log(`  Admin email: ${admin.email}`)
  if (hr) console.log(`  HR email: ${hr.email}`)
  if (trainer) console.log(`  Trainer email: ${trainer.email}`)
  if (staff) console.log(`  Staff email: ${staff.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
