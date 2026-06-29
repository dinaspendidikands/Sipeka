# PRD — Website Penilaian Kinerja Kepala Sekolah & Guru (SIPEKA)
**Dinas Pendidikan Kabupaten Deli Serdang**
Versi 2.1 — 13 Juni 2026 · *disinkronkan dengan kondisi website yang telah dibangun*

---

## 1. Latar Belakang

Dinas Pendidikan Kabupaten Deli Serdang melakukan penilaian kinerja kepala sekolah (PAUD/TK, SD, SMP) dan guru secara berkala. Sebelumnya pengisian memakai Google Form dan rekap manual di Excel (`data.xlsx`). Website SIPEKA menyatukan pengisian penilaian beratribusi akun, perhitungan nilai otomatis, pencetakan rapor (satuan & massal), laporan visual, serta akses offline.

**Skala data:** ±600 kepala sekolah, ±10.000 guru, 22 kecamatan, pengisian berulang per minggu/bulan/triwulan.

## 2. Arsitektur Teknis

| Komponen | Teknologi |
|---|---|
| Frontend | HTML/CSS/JS statis di **GitHub Pages** (`index`, `login`, 3 form, `rapor`, `dashboard`, `admin`) |
| Backend | **Google Apps Script** Web App (`doGet`/`doPost` JSON; POST `text/plain` anti-preflight CORS) |
| Database | **Google Spreadsheet** (urutan kolom penilaian identik `data.xlsx` — data Google Form lama bisa ditempel langsung) |
| Bukti dukung | Link folder **Google Drive** + QR code (digenerate di browser, qrcodejs) |
| Chart | Chart.js (CDN, ikut di-cache offline) |
| Offline | Service worker (cache halaman) + snapshot data di IndexedDB + draft & antrean kirim ulang |

### 2.1 Struktur Google Spreadsheet (dibuat otomatis oleh `setup()`)

| Sheet | Isi |
|---|---|
| `MASTER_SEKOLAH` | NPSN, nama sekolah, jenjang, kecamatan, nama+HP KS, nama+HP pengawas, **NIP KS** (9 kolom). *NIP pengawas tidak disimpan di sini* |
| `MASTER_GURU` | NPSN, nama guru, NIP/NUPTK, status, pangkat, mapel, HP |
| `AKUN_PENGAWAS` | **Username = NIP**, nama, HP, hash password, kunci API, wajib-ganti, terakhir login |
| `AKUN_KS` | **Username = NPSN**, nama sekolah, nama KS, hash password, kunci API, wajib-ganti, terakhir login |
| `KS_SD_SMP` | Respons penilaian KS SD & SMP (147 kolom, termasuk agregat) |
| `KS_PAUD` | Respons penilaian KS PAUD/TK (109 kolom) |
| `GURU` | Respons penilaian guru (59 kolom) |
| `PENGATURAN` | Hash password admin, ambang kategori, kelompok baseline, hash password awal akun |

**Relasi kunci:** sekolah binaan pengawas = baris `MASTER_SEKOLAH` dengan NAMA PENGAWAS sama (ejaan harus konsisten); NIP pengawas untuk rapor diambil dari `AKUN_PENGAWAS` via nama (sumber tunggal, anti-konflik); NIP KS untuk rapor diambil dari `MASTER_SEKOLAH` via NPSN.

## 3. Pengguna & Hak Akses

| Pengguna | Login | Hak |
|---|---|---|
| Pengawas | username **NIP** + password | Mengisi penilaian KS — **hanya sekolah binaannya** (divalidasi di server); ganti password sendiri |
| Kepala sekolah | username **NPSN** + password | Mengisi penilaian guru — **hanya satuan pendidikannya** (divalidasi di server); ganti password sendiri |
| Admin kecamatan | username **nama kecamatan** + password | Membuka halaman **Hasil Penilaian** se-kecamatannya dan **mengedit/menghapus** hasil penilaian KS & guru (identitas tidak diubah; agregat dihitung ulang server; hapus dikonfirmasi) |
| Publik | tanpa login | Cetak rapor (satuan & massal) |
| Admin Dinas | password admin | Dashboard & laporan, tarik data offline, ekspor CSV, pengaturan kategori/baseline, generate & reset akun, ganti password admin, **Hasil Penilaian seluruh kecamatan (lihat/edit/hapus)** |

Password awal akun dibuat admin (seragam); pengguna **wajib mengganti** saat login pertama. Admin dapat **reset ke password awal**. Kiriman penilaian diautentikasi kunci akun yang tidak kedaluwarsa (aman untuk antrean offline). Login admin juga bisa **offline** (verifikasi hash lokal di perangkat yang pernah login online; fitur tulis-server nonaktif selama sesi offline).

## 4. Fitur (sebagaimana terbangun)

### F1 — Form Penilaian KS SD & SMP *(login pengawas)*
26 indikator / 6 kelompok (Performance Sekolah, Tata Kelola Sampah, Inovasi, Indeks Kepuasan & Kepemimpinan, Prestasi Murid, Dokumen Sekolah); tiap indikator Baseline–Target–Capaian skala 1–5 + link dokumentasi Drive; Periode (TW1–TW4), Bulan, Minggu; catatan & rekomendasi; ringkasan nilai tampil langsung saat mengisi.

### F2 — Form Penilaian KS PAUD/TK *(login pengawas)*
17 indikator / 6 kelompok (Performance, Kebijakan SRA, Teknologi & 7 KAIH, Tumbuh Kembang Anak, Kemitraan, Dokumen Sekolah); tanpa kolom Triwulan; selebihnya sama dengan F1.

**Perilaku identitas F1/F2:**
- Pilih kecamatan → sekolah (hanya binaan) → NPSN, nama sekolah, jenjang, kecamatan, nama+HP+NIP KS terisi otomatis dan **dapat diperbaiki**.
- **Nama & NIP pengawas terkunci** (diambil dari akun login / AKUN_PENGAWAS, tidak dapat diedit).
- Opsi **"✏️ Ketik manual"** untuk sekolah di luar daftar.
- Saat kirim, perbaikan identitas **menyinkronkan MASTER_SEKOLAH** (kolom terisi menimpa; kolom kosong tidak menghapus); sekolah hasil ketik manual **otomatis ditambahkan** sebagai baris baru master.

### F3 — Form Penilaian Guru *(login kepala sekolah)*
Identitas sekolah **terkunci** ke akun KS; guru dipilih dari MASTER_GURU atau diisi manual. 5 kelompok observasi: butir checklist **Ya=1/Tidak=0**, khusus **7 butir survey kepuasan diisi skor desimal 0–1** (2 desimal, mis. 0,85; koma/titik diterima). Nilai kelompok = persen; rata keseluruhan = rata 5 kelompok. Link bukti dukung per kelompok.

### F4 — Keandalan Pengisian (F1–F3)
- **Draft otomatis** di perangkat (IndexedDB): isian dipulihkan walau browser ditutup/internet mati; tombol "Kosongkan Isian".
- **Antrean kirim ulang**: kiriman gagal tersimpan dan terkirim otomatis saat online (atau manual); tidak ada data hilang.
- Master data fallback dari snapshot saat offline.

### F5 — Cetak Rapor *(publik, online/offline)*
- **3 format**: KS SD&SMP, KS PAUD/TK, Guru — kop dinas, info sekolah dengan **titik dua sejajar** (No. HP baris sendiri), tabel indikator, link dokumentasi klik + **QR rata tengah**, nilai rata-rata & kinerja (capaian−baseline). *Kategori capaian sementara disembunyikan di lembar cetak* (mudah dimunculkan kembali).
- **Tanda tangan** dua kolom rata kiri: Pengawas + **NIP** ↔ Kepala Sekolah + **NIP** (rapor guru: Guru ↔ KS+NIP); **tanggal rapor diisi manual** lewat kotak isian.
- **Multi-pengisian sebulan**: semua pengisian ditampilkan sebagai daftar dan dapat dipilih untuk dicetak.
- **Cetak banyak sekaligus**: rapor KS per **nama pengawas** + bulan; rapor guru per **nama kepala sekolah** + bulan; semua pengisian ikut; **1 rapor = 1 halaman A4** (judul selalu di puncak halaman baru; baris tabel & blok ttd tidak terpotong); sekali klik jadi satu PDF.

### F6 — Laporan & Dashboard *(khusus admin)*
Filter jenis/kecamatan/bulan; chart distribusi kategori, rata kinerja per kecamatan, tren bulanan; nama sekolah & KS/guru **tertinggi dan terendah**; **ranking KS dua tahap**: kelompokkan dulu per Rata Baseline (default 1–1,9 / 2–2,9 / 3–3,9 / 4–5) lalu rangking Kinerja = Capaian − Baseline di dalam kelompok; ranking guru per rata %; ekspor **CSV** ringkasan KS & guru.

### F7 — Mode Offline & Tarik Data *(khusus admin untuk tarik; baca offline di perangkat tsb)*
Tombol **Tarik Data** menyimpan snapshot lengkap (ringkasan + detail + master + pengaturan) ke IndexedDB; service worker meng-cache halaman & library. Setelah itu dashboard, chart, ranking, dan **rapor (satuan & massal) bisa dibuka dan dicetak tanpa internet**. **Saklar Online/Offline** di Dashboard & Rapor (🟢/📴): otomatis ikut jaringan, bisa dipaksa offline.

### F8 — Halaman Admin
Login admin (online/offline-lokal); **pengaturan ambang kategori** nilai KS (skala 1–5) & guru (%) serta **batas kelompok baseline** — semua dapat diubah tanpa kode dan langsung berlaku; **Generate Akun Massal** (KS dari master; pengawas per nama unik, NIP diisi di sheet); **Reset password akun** ke password awal; ganti password admin.

### F10 — Hasil Penilaian per Kecamatan (`hasil-penilaian.html`) *(login admin kecamatan, atau Admin Dinas)*
Tab KS PAUD/TK · KS SD&SMP · Guru; filter bulan & pencarian; tabel ringkas seluruh pengisian se-kecamatan (sekolah/nama, periode, rata baseline/capaian, kinerja, waktu isi). Tombol **Edit** membuka detail satu pengisian: nilai indikator (1–5 / checklist / survey 0–1), link dokumentasi, dan catatan dapat diubah — identitas terkunci, rata & kinerja dihitung ulang otomatis di server. Tombol **Hapus** menghapus satu baris pengisian setelah konfirmasi ("Yakin hapus?") untuk mencegah penghapusan tidak sengaja. Sheet `AKUN_KECAMATAN` menampung akun admin kecamatan (username = nama kecamatan, dibuat massal dari daftar kecamatan unik master); kepemilikan baris diverifikasi terhadap kecamatan akun.

**Akses Admin Dinas:** admin yang login di `admin.html`/`dashboard.html` dapat membuka halaman ini untuk **semua kecamatan** — memilih kecamatan dari dropdown (daftar diambil dari kecamatan unik di master), lalu melihat, mengedit, dan menghapus data kecamatan tersebut tanpa batasan kepemilikan.

### F9 — Login Penilai (`login.html`)
Pilih peran (Pengawas/Kepala Sekolah), masuk dengan NIP/NPSN; paksa ganti password awal; menu ganti password & keluar; sesi tersimpan di perangkat sehingga praktis untuk pengisian berulang.

## 5. Aturan Perhitungan (dihitung backend saat submit)

**KS (skala 1–5):** Rata Baseline/Target/Capaian = rata 26 (atau 17) indikator; Kinerja per kelompok & keseluruhan = Rata Capaian − Rata Baseline → dasar ranking dalam kelompok baseline.
**Guru:** butir checklist 0/1 dan survey desimal 0–1 (dibulatkan 2 desimal); nilai kelompok = (jumlah ÷ banyak butir) × 100; Rata Keseluruhan = rata 5 kelompok → dasar ranking & kategori.
**Kategori & kelompok baseline:** dari sheet `PENGATURAN` (diatur admin).
**Data lama** tanpa kolom agregat dihitung ulang otomatis saat laporan.

## 6. Performa & Keandalan (10.000 guru)

Endpoint laporan mengirim ringkasan (bukan baris penuh); detail penuh hanya saat Tarik Data; master guru dimuat per sekolah; snapshot offline mengurangi panggilan berulang (kuota Apps Script ±20.000/hari); sheet dapat dipecah per tahun ajaran bila >50.000 baris.

## 7. Di Luar Cakupan (v2)

Upload file langsung ke Drive dari website (tetap tempel link); notifikasi WA/email; kategori capaian pada lembar cetak rapor (disembunyikan sementara atas permintaan, akan dimunculkan kembali).

## 8. Status Pengerjaan

Seluruh fitur F1–F10 **sudah dibangun dan terverifikasi sintaks/logika**. Panduan deploy, master data, akun, offline, troubleshooting, dan checklist go-live ada di `README.md`. Versi cache service worker saat ini: **sipeka-v18**.

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Kuota Apps Script | Ringkasan terhitung, snapshot offline, mode paksa offline |
| Ejaan nama pengawas tidak konsisten di master | Relasi binaan & NIP berbasis nama — samakan ejaan (ada di troubleshooting README) |
| Token kedaluwarsa utk kiriman antrean | Autentikasi kiriman memakai kunci akun permanen, bukan token sesi |
| Duplikat pengisian sebulan | Rapor menampilkan semua pengisian untuk dipilih; cetak banyak menyertakan semuanya |
| Sheet membesar | Pecah per tahun ajaran; ekspor CSV tersedia |
