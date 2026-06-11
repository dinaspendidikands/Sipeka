/* ============================================================
   SIPEKA — Definisi Indikator Penilaian (sumber: data.xlsx)
   Dipakai oleh: form, rapor, dashboard, dan backend (disalin)
   ============================================================ */

// ---------- KEPALA SEKOLAH SD & SMP : 26 indikator, 6 kelompok ----------
const KS_SDSMP_KELOMPOK = [
  { nama: 'Performance Sekolah', indikator: [
    { kode: '1.1', nama: 'Kebersihan Lingkungan Satuan Pendidikan' },
    { kode: '1.2', nama: 'Kebersihan Lingkungan Belajar' },
    { kode: '1.3', nama: 'Kelengkapan Sanitasi dan Kebersihan Kamar Mandi' },
    { kode: '1.4', nama: 'Kerindangan dan Apotik Hidup Sekolah' },
    { kode: '1.5', nama: 'Mewujudkan Sekolah Adiwiyata' },
    { kode: '1.6', nama: 'Mewujudkan sekolah dan kantin Sehat' }
  ]},
  { nama: 'Tata Kelola Sampah', indikator: [
    { kode: '2.1', nama: 'Ketersediaan Tong Sampah Sesuai Peruntukan' },
    { kode: '2.2', nama: 'Pengelolaan bank Sampah' },
    { kode: '2.3', nama: 'Tempat Pengomposan dan Pengolahan Sampah Organik' },
    { kode: '2.4', nama: 'Produk Daur Ulang' }
  ]},
  { nama: 'Inovasi Sekolah', indikator: [
    { kode: '3.1', nama: 'Jumlah Inovasi di Sekolah' },
    { kode: '3.2', nama: 'Pemanfaatan Teknologi dalam Pembelajaran' },
    { kode: '3.3', nama: 'Upaya meningkatkan literasi dan numerasi' }
  ]},
  { nama: 'Indeks Kepuasan & Kepemimpinan', indikator: [
    { kode: '4.1', nama: 'Indeks kepuasan Orang Tua Murid' },
    { kode: '4.2', nama: 'Indeks kepuasan Siswa' },
    { kode: '4.3', nama: 'Indeks Kepuasan guru dan staff' }
  ]},
  { nama: 'Prestasi Murid', indikator: [
    { kode: '5.1', nama: 'Jumlah murid dalam mengikuti perlombaan di bidang akademik dan non akademik' },
    { kode: '5.2', nama: 'Jumlah Murid yang Berprestasi di bidang akademik' },
    { kode: '5.3', nama: 'Jumlah Murid yang Berprestasi di bidang non akademik' },
    { kode: '5.4', nama: 'Jumlah Murid yang tidak Lancar Calistung' },
    { kode: '5.5', nama: 'Partisipasi Murid dalam Ekstrakurikuler' }
  ]},
  { nama: 'Kelengkapan Dokumen Sekolah', indikator: [
    { kode: '6.1', nama: 'Dokumen Rencana Kerja Sekolah' },
    { kode: '6.2', nama: 'Dokumen Kurikulum Satuan Pendidikan' },
    { kode: '6.3', nama: 'Dokumen Inventaris Barang' },
    { kode: '6.4', nama: 'Dokumen Administrasi Murid' },
    { kode: '6.5', nama: 'Laporan Penggunaan Dana BOS' }
  ]}
];

// ---------- KEPALA SEKOLAH PAUD/TK : 17 indikator, 6 kelompok ----------
const KS_PAUD_KELOMPOK = [
  { nama: 'Performance', indikator: [
    { kode: '1.1', nama: 'Kebersihan Lingkungan Satuan Pendidikan' },
    { kode: '1.2', nama: 'Kebersihan Lingkungan Belajar' },
    { kode: '1.3', nama: 'Kelengkapan Sanitasi dan Kebersihan Kamar Mandi' },
    { kode: '1.4', nama: 'Kerindangan dan Apotik Hidup Sekolah' }
  ]},
  { nama: 'Kebijakan Sekolah Ramah Anak (SRA)', indikator: [
    { kode: '2.1', nama: 'Area bermain aman bagi anak' },
    { kode: '2.2', nama: 'Terpisah toilet laki-laki dan perempuan' },
    { kode: '2.3', nama: 'Parenting' }
  ]},
  { nama: 'Pemanfaatan Teknologi & 7 KAIH', indikator: [
    { kode: '3.1', nama: 'Pemanfaatan Teknologi dan tersedianya APE dalam pembelajaran' },
    { kode: '3.2', nama: 'Pelaksanaan kegiatan 7 KAIH' }
  ]},
  { nama: 'Data Tumbuh Kembang Anak', indikator: [
    { kode: '4.1', nama: 'Pertumbuhan dan perkembangan anak' }
  ]},
  { nama: 'Kemitraan', indikator: [
    { kode: '5.1', nama: 'Kerjasama dengan puskesmas, posyandu, atau lembaga lain' },
    { kode: '5.2', nama: 'Keterlibatan orang tua dalam kegiatan sekolah' }
  ]},
  { nama: 'Dokumen Sekolah', indikator: [
    { kode: '6.1', nama: 'Dokumen Rencana Kerja Sekolah' },
    { kode: '6.2', nama: 'Dokumen Kurikulum Satuan Pendidikan' },
    { kode: '6.3', nama: 'Dokumen Inventaris Barang' },
    { kode: '6.4', nama: 'Dokumen Administrasi Murid' },
    { kode: '6.5', nama: 'Laporan Penggunaan Dana BOS' }
  ]}
];

// ---------- GURU : 5 kelompok observasi (checklist 0/1) ----------
const GURU_KELOMPOK = [
  { nama: 'Manajemen Ruang & Lingkungan Sekolah', penilai: 'Kepala Sekolah', butir: [
    'Kebersihan Ruangan Terjaga (Lantai, meja, kursi, papan tulis, lemari, jendela)',
    'Kerapian: Tidak ada sampah berserakan di dalam laci atau sudut kelas',
    'Kenyamanan: Ruangan memiliki ventilasi dan pencahayaan yang baik (tidak pengap)',
    'Tata Ruang: Layout kelas ditata secara estetis dan fungsional untuk belajar',
    'Atribut Wajib: Tersedia pajangan ruang, tata tertib, dan struktur organisasi, atau kesepakatan pemakaian ruang',
    'Administrasi Ruang: Tersedia daftar piket/absensi, Kartu Inventaris Ruang, dan Nomor Inventaris Barang',
    'Program Sekolah: Guru menjadi penanggung jawab/terlibat aktif dalam program'
  ]},
  { nama: 'Tata Kelola Sampah', penilai: 'Kepala Sekolah', butir: [
    'Pilah Sampah: Tersedia minimal 2 tempat sampah terpisah (Organik & Anorganik)',
    'Pelabelan: Tempat sampah memiliki label/keterangan pemilahan yang jelas',
    'Wadah barang untuk Bank Sampah: Tersedia wadah bank sampah untuk >2 jenis sampah (plastik, kertas, dll)',
    'Manajemen Data: Adanya buku catatan/tabungan bank sampah yang rutin diisi'
  ]},
  { nama: 'Inovasi & Pengembangan Profesi', penilai: 'Kepala Sekolah', butir: [
    'Karya Inovasi: Guru menunjukkan bukti 4 produk inovasi dalam 1 TA (media/buku/artikel dalam jurnal terindeks, artikel/opini di media massa)',
    'Integrasi IT: Guru menggunakan IT (Canva/PPT/Kuis Online) minimal 2x seminggu dengan salah satu perangkat HP, tablet, laptop, IFP, infocus, dan lainnya',
    'Ketersediaan sumber belajar yang bervariasi digital dan non digital',
    'Dampak integrasi Literasi-Numerasi: pemahaman dan penerapan dari sumber belajar',
    'Diklat: Memiliki bukti minimal sertifikat 4 kegiatan pengembangan profesi dalam setahun',
    'Partisipasi Guru dalam kegiatan lomba akademik dan non akademik',
    'Pendampingan sejawat (Tim penilaian Kinerja, Mentoring, Coaching, Narasumber pelatihan, Narasumber berbagi)',
    'Meraih Penghargaan di Bidang Akademik maupun Non Akademik'
  ]},
  /* 7 butir pertama = survey, diisi skor desimal 0–1 (mis. 0,85); sisanya checklist Ya/Tidak */
  { nama: 'Kepuasan, Komunikasi & Prestasi Siswa', penilai: 'Kepala Sekolah, Siswa, Orang Tua Siswa (Komite Sekolah), Teman Sejawat', skor: 7, butir: [
    'Survey Kepuasan Kinerja Guru dari Siswa 1',
    'Survey Kepuasan Kinerja Guru dari Siswa 2',
    'Survey Kepuasan Kinerja Guru dari Orang Tua (Komite Sekolah) 1',
    'Survey Kepuasan Kinerja Guru dari Orang Tua (Komite Sekolah) 2',
    'Survey Kepuasan Kinerja Guru dari Teman Sejawat 1',
    'Survey Kepuasan Kinerja Guru dari Teman Sejawat 2',
    'Survey Kepuasan Kinerja Guru dari Kepala Sekolah',
    'Pembimbingan: Guru Membimbing Siswa dalam Ajang Lomba Akademik/Non-Akademik',
    'Output Prestasi: Siswa bimbingan meraih prestasi tingkat Kabupaten/Kota/Provinsi/Nasional/Internasional',
    'Ekstrakurikuler: pendampingan ekskul'
  ]},
  { nama: 'Praktek Pembelajaran-Perangkat Pembelajaran', penilai: 'Pengawas Satuan Pendidikan', butir: [
    'Perangkat Ajar: Memiliki lengkap 5 dokumen (TP, ATP, RPM, Prog. Kokurikuler & Ekskul) dengan pendekatan',
    'Asesmen: Dokumen penilaian siswa lengkap, rapi, dan terorganisir sesuai prosedur',
    'Tindak Lanjut: Terdapat bukti analisis hasil evaluasi untuk perbaikan pembelajaran',
    'Praktik Pembelajaran sesuai dengan perangkat yang dikumpulkan dan diobservasi'
  ]}
];

const BULAN_LIST = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MINGGU_LIST = ['I','II','III','IV','V'];
const TW_LIST = ['TW1','TW2','TW3','TW4'];

// ---------- Pengaturan default (dapat diubah admin → sheet PENGATURAN) ----------
const PENGATURAN_DEFAULT = {
  // kategori guru: nilai persen 0–100, urut dari ambang tertinggi
  kategoriGuru: [
    { min: 90, label: 'Sangat Baik' },
    { min: 76, label: 'Baik' },
    { min: 61, label: 'Cukup' },
    { min: 0,  label: 'Kurang' }
  ],
  // kategori KS: berdasarkan Rata Capaian skala 1–5
  kategoriKS: [
    { min: 4.5, label: 'Sangat Baik' },
    { min: 3.5, label: 'Baik' },
    { min: 2.5, label: 'Cukup' },
    { min: 0,   label: 'Kurang' }
  ],
  // kelompok baseline untuk ranking KS
  kelompokBaseline: [
    { min: 1, max: 1.9, label: 'Kelompok A (1–1,9)' },
    { min: 2, max: 2.9, label: 'Kelompok B (2–2,9)' },
    { min: 3, max: 3.9, label: 'Kelompok C (3–3,9)' },
    { min: 4, max: 5,   label: 'Kelompok D (4–5)' }
  ]
};

function kategoriDari(nilai, daftar) {
  for (const k of daftar) if (nilai >= k.min) return k.label;
  return daftar[daftar.length - 1].label;
}
function kelompokBaselineDari(baseline, daftar) {
  for (const k of daftar) if (baseline >= k.min && baseline <= k.max) return k.label;
  return baseline < daftar[0].min ? daftar[0].label : daftar[daftar.length - 1].label;
}

// daftar indikator rata (flat) — dipakai rapor
function flatIndikator(kelompok) {
  const out = [];
  kelompok.forEach(g => g.indikator.forEach(i => out.push({ ...i, kelompok: g.nama })));
  return out;
}

/* ---------- Peta kolom (0-based) baris data di Google Sheet ----------
   Harus identik dengan urutan kolom yang ditulis backend Apps Script. */
function layoutKS(jenis) {
  const paud = jenis === 'paud';
  const kelompok = paud ? KS_PAUD_KELOMPOK : KS_SDSMP_KELOMPOK;
  const identCount = paud ? 12 : 13; // PAUD tanpa kolom Periode TW
  const flat = flatIndikator(kelompok);
  const ind = flat.map((x, i) => {
    const base = identCount + i * 4;
    return { ...x, colB: base, colT: base + 1, colC: base + 2, colLink: base + 3 };
  });
  let p = identCount + flat.length * 4;
  const map = { identCount, kelompok, ind, colCatatan: p++ };
  if (!paud) map.colNomorUrut = p++;
  map.colRataB = p++; map.colRataT = p++; map.colRataC = p++; map.colKinerja = p++;
  map.grup = kelompok.map(g => ({ nama: g.nama, colB: p++, colT: p++, colC: p++, colKinerja: p++ }));
  // posisi kolom identitas
  map.id = paud
    ? { ts:0, email:1, npsn:2, kecamatan:3, jenjang:4, sekolah:5, pengawas:6, hpPengawas:7, ks:8, hpKS:9, bulan:10, minggu:11 }
    : { ts:0, email:1, npsn:2, kecamatan:3, jenjang:4, sekolah:5, pengawas:6, hpPengawas:7, ks:8, hpKS:9, periode:10, bulan:11, minggu:12 };
  return map;
}

function layoutGuru() {
  const identCount = 15;
  let p = identCount;
  const grup = GURU_KELOMPOK.map(g => {
    const cols = g.butir.map(() => p++);
    return { nama: g.nama, penilai: g.penilai, butir: g.butir, cols, colLink: p++ };
  });
  const map = { identCount, grup, colRata: [], };
  GURU_KELOMPOK.forEach(() => map.colRata.push(p++));
  map.colRataAll = p++;
  map.id = { ts:0, email:1, kecamatan:2, jenjang:3, npsn:4, sekolah:5, ks:6, hpKS:7, nama:8, status:9, pangkat:10, nip:11, mapel:12, hp:13, bulan:14 };
  return map;
}
