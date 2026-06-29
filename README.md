# SIPEKA — Sistem Penilaian Kinerja Kepala Sekolah & Guru
Dinas Pendidikan Kabupaten Deli Serdang
Frontend **GitHub Pages** · Backend **Google Apps Script** · Database **Google Sheets**
*Dokumen produk: `PRD-Penilaian-Kinerja.md` v2.1 — README ini selaras dengan versi tersebut.*

---

## 1. Struktur File

```
index.html              Landing page
login.html              Login penilai (pengawas NIP / kepala sekolah NPSN) + ganti password
form-ks-sd-smp.html     [Login pengawas] Penilaian KS SD & SMP (26 indikator, skala 1–5)
form-ks-paud.html       [Login pengawas] Penilaian KS PAUD/TK (17 indikator, skala 1–5)
form-guru.html          [Login KS] Penilaian guru (checklist 0/1 + 7 survey skor 0–1)
rapor.html              [Publik] Cetak rapor: satu / banyak (per pengawas / per KS), A4, QR
hasil-penilaian.html    [Admin kecamatan / Admin Dinas] Hasil Penilaian + edit & hapus nilai KS & guru
kelola-master.html      [Admin kecamatan / Admin Dinas] Tambah, edit & hapus MASTER_SEKOLAH & MASTER_GURU
dashboard.html          [Admin] Chart, tertinggi/terendah, ranking baseline, tarik data, CSV
admin.html              [Admin] Pengaturan kategori & baseline, generate/reset akun, password
sw.js                   Service worker — cache offline (versi saat ini: sipeka-v14)
css/app.css             Gaya bersama + aturan cetak (1 rapor = 1 halaman A4)
js/config.js            ⚠ API_URL diisi di sini + util (sesi, mode offline, draft, antrean)
js/indikator.js         Definisi indikator & peta kolom database (kontrak dgn backend)
js/form-ks.js           Logika form kepala sekolah
apps-script/Code.gs     Backend — tempel ke Apps Script
PRD-Penilaian-Kinerja.md
```

## 2. Setup Database + Backend (sekali saja)

1. Buat **Google Spreadsheet** baru, beri nama mis. `DB SIPEKA`.
2. **Extensions → Apps Script** → hapus isi `Code.gs` → tempel seluruh isi `apps-script/Code.gs` → simpan.
3. Pilih fungsi **`setup`** → **Run** → beri izin. **Sembilan sheet** dibuat otomatis:
   `MASTER_SEKOLAH`, `MASTER_GURU`, `AKUN_PENGAWAS`, `AKUN_KS`, `AKUN_KECAMATAN`, `KS_SD_SMP`, `KS_PAUD`, `GURU`, `PENGATURAN`.
4. **Deploy → New deployment → Web app**: Execute as **Me**, akses **Anyone** → salin URL `/exec`.

> **Jika Code.gs diubah:** Deploy → **Manage deployments** → ✏️ → Version **New version** → Deploy (URL tetap).

## 3. Isi Master Data

| Sheet | Isi | Catatan |
|---|---|---|
| `MASTER_SEKOLAH` | NPSN, nama sekolah, jenjang, kecamatan, nama+HP KS, nama+HP pengawas, **NIP KS** (9 kolom) | NIP pengawas **tidak** di sini — otomatis dari `AKUN_PENGAWAS`. Ejaan NAMA PENGAWAS harus konsisten antar baris (dasar relasi binaan) |
| `MASTER_GURU` | NPSN, nama guru, NIP/NUPTK, status, pangkat, mapel, HP | ±10.000 baris, impor dari Dapodik/Excel |

Data penilaian lama dari Google Form dapat **ditempel langsung** ke `KS_SD_SMP` / `KS_PAUD` / `GURU` (urutan kolom sama dengan `data.xlsx`).

## 4. Setup Frontend (GitHub Pages)

1. `js/config.js` → isi `API_URL` dengan URL Web app.
2. Unggah semua file ke repositori GitHub → **Settings → Pages** → Deploy from branch `main` / root.
3. **Setiap kali frontend diubah**: unggah ulang + **naikkan versi cache** di `sw.js` (v15, v16, …) agar browser pengguna mengambil versi baru.

## 5. Akun Pengawas & Kepala Sekolah

- **Form penilaian wajib login**: pengawas (username **NIP**) hanya dapat menilai sekolah binaannya; kepala sekolah (username **NPSN**) hanya guru di satuan pendidikannya — dibatasi di form **dan divalidasi di server**.
- **Generate akun**: Admin → *Akun Pengawas & Kepala Sekolah* → pilih peran + password awal seragam → **Generate Akun Massal**. Akun KS dibuat dari `MASTER_SEKOLAH`; akun pengawas per nama pengawas unik — lalu **isi kolom NIP (USERNAME)** di sheet `AKUN_PENGAWAS` agar bisa login.
- **Password**: wajib diganti saat login pertama; ganti mandiri kapan saja di `login.html`; admin dapat **Reset ke Password Awal** per akun.
- **Identitas pengawas di form terkunci** (nama & NIP dari akun); identitas lain otomatis dari master dan **dapat diperbaiki** — perbaikan tersinkron ke `MASTER_SEKOLAH`, dan sekolah hasil **ketik manual otomatis terdaftar** sebagai baris master baru.
- Kiriman diautentikasi **kunci akun permanen** → antrean offline tetap valid dikirim kapan pun.
- **Akun admin kecamatan** (username = **nama kecamatan**, boleh diketik tanpa spasi saat login): generate massal per kecamatan unik di master; membuka halaman **Hasil Penilaian** berisi seluruh pengisian KS PAUD/SD&SMP dan guru se-kecamatannya, dan dapat **mengedit nilai, link dokumentasi & catatan**, serta **menghapus** data pengisian (identitas tidak bisa diubah; rata & kinerja dihitung ulang server; kepemilikan kecamatan divalidasi server; hapus selalu dikonfirmasi).
- **Admin Dinas** juga dapat membuka **Hasil Penilaian** (menu di Dashboard/Pengaturan) untuk **semua kecamatan** — pilih kecamatan dari dropdown, lalu lihat/edit/hapus datanya tanpa batasan kepemilikan.
- **Kelola Data Master** (`kelola-master.html`): Admin kecamatan dapat **menambah, mengedit, dan menghapus** baris `MASTER_SEKOLAH` & `MASTER_GURU` di kecamatannya (kecamatan guru ditentukan dari NPSN sekolahnya; NPSN dikunci saat edit; kecamatan terkunci ke wilayah akun). Admin Dinas dapat mengelola master **semua kecamatan** via dropdown. Penghapusan dikonfirmasi dan diperingatkan bila masih ada data penilaian/guru terkait. Kepemilikan kecamatan divalidasi server pada setiap aksi; semua tulis memakai `LockService`.

## 6. Login Admin & Pengaturan

- **🔒 Masuk Admin** → password awal **`admin123`** → segera ganti.
- Pengaturan: ambang kategori nilai KS (skala 1–5) & guru (%), batas kelompok baseline ranking (default 1–1,9 / 2–2,9 / 3–3,9 / 4–5) — langsung berlaku tanpa ubah kode.
- Sesi admin online 6 jam; **login admin offline** tersedia di perangkat yang pernah login online (fitur tulis-server nonaktif selama offline).

## 7. Alur Pemakaian

| Pengguna | Halaman | Keterangan |
|---|---|---|
| Pengawas | Login → Form KS SD/SMP atau PAUD | Hanya sekolah binaan; nilai & ringkasan dihitung otomatis; draft tersimpan otomatis |
| Kepala sekolah | Login → Form Guru | Sekolah terkunci ke akun; guru dari master atau manual; survey diisi skor 0–1 (mis. 0,85) |
| Publik | Cetak Rapor | **Cetak Satu** (jika >1 pengisian sebulan, pilih dari daftar) atau **Cetak Banyak** (KS per pengawas; guru per kepala sekolah) — 1 rapor = 1 halaman A4, QR, NIP di ttd, tanggal rapor diisi manual |
| Admin kecamatan | Login → Hasil Penilaian | Tabel pengisian KS & guru se-kecamatan (tab, filter bulan, pencarian) + edit & hapus nilai |
| Admin | Dashboard | Chart, tertinggi/terendah, ranking per kelompok baseline, ekspor CSV |
| Admin | Hasil Penilaian | Pilih kecamatan (dropdown semua kecamatan) → tabel pengisian KS & guru + edit & hapus nilai |
| Admin | Tarik Data | Snapshot offline untuk dashboard & rapor |

Catatan rapor: kategori capaian **sementara tidak ditampilkan** di lembar cetak (sesuai keputusan; mudah dimunculkan kembali).

## 8. Mode Offline

1. Admin → Dashboard → **📥 Tarik Data** (snapshot ke IndexedDB; service worker meng-cache halaman & library).
2. Tanpa internet di perangkat itu: dashboard, chart, ranking, dan **rapor (satu & banyak) tetap bisa dibuka & dicetak**.
3. Form saat offline: master dari snapshot, isian jadi draft, kiriman masuk **antrean** dan terkirim otomatis saat online.
4. **Saklar Online/Offline** (Dashboard & Rapor): 🟢 ONLINE / 📴 OFFLINE — otomatis ikut jaringan, bisa dipaksa offline (hemat kuota).
5. **Login admin offline**: password diverifikasi hash lokal di perangkat yang pernah login online.

## 9. Pemecahan Masalah

| Gejala | Penyebab & solusi |
|---|---|
| "Gagal memuat master data" | `API_URL` salah/belum diisi, atau deployment belum "Anyone" |
| Submit gagal terus | Buka `…/exec?action=master` di browser — harus JSON; jika error, redeploy New version |
| Perubahan frontend tidak muncul | Naikkan versi cache `sw.js` lalu unggah ulang |
| Rapor "Belum ada penilaian" | Cocokkan bulan & sekolah/guru dengan isi sheet |
| Pengawas tidak bisa login | Kolom NIP (USERNAME) di `AKUN_PENGAWAS` masih kosong |
| Sebagian sekolah binaan tidak tampil | Ejaan NAMA PENGAWAS di `MASTER_SEKOLAH` tidak konsisten — samakan persis |
| NIP pengawas kosong di rapor | Nama di `AKUN_PENGAWAS` tidak sama persis dengan NAMA PENGAWAS di master |
| Lupa password admin | Di Apps Script jalankan: `tulisSetting_('adminHash', hash_('passwordBaru'))` |
| Antrean tidak terkirim otomatis | Buka halaman form saat online, atau klik "Kirim Ulang Sekarang" |

## 10. Checklist Go-Live

- [ ] `setup()` dijalankan — 8 sheet terbentuk
- [ ] Web app dideploy (Me / Anyone), URL `/exec` di `js/config.js`
- [ ] `MASTER_SEKOLAH` (±600, termasuk NIP KS) & `MASTER_GURU` (±10.000) terisi
- [ ] Generate akun KS & pengawas + isi NIP pengawas di `AKUN_PENGAWAS`
- [ ] Data lama Google Form ditempel ke sheet respons (opsional)
- [ ] Frontend di GitHub Pages aktif
- [ ] Uji: login pengawas → isi penilaian KS → cetak rapornya (cek NIP & QR)
- [ ] Uji: login KS → isi penilaian guru (termasuk survey 0–1) → cetak rapor guru
- [ ] Uji cetak banyak per pengawas & per kepala sekolah
- [ ] Uji offline: Tarik Data → matikan internet → dashboard & rapor
- [ ] Password admin diganti dari `admin123`

## 11. Catatan Teknis

- POST `text/plain` (hindari preflight CORS Apps Script); agregat dihitung backend saat submit; data lama tanpa agregat dihitung ulang saat laporan.
- Ranking KS dua tahap: kelompok baseline dulu, lalu Kinerja = Rata Capaian − Rata Baseline di dalam kelompok.
- Survey guru menerima desimal 0–1 (2 desimal, koma/titik); checklist tetap 0/1 — kompatibel data lama.
- **Kunci tulis & anti-duplikat**: submit memakai `LockService` (pengisian serentak tidak saling menyela) dan kolom terakhir **ID KIRIM** — kiriman ulang (manual atau dari antrean) dengan ID sama dikenali duplikat dan tidak ditulis dua kali.
- **Hasil Penilaian**: edit & hapus memakai `LockService`; akses admin Dinas (token) tidak dibatasi kecamatan, akses admin kecamatan (kunci akun) hanya untuk baris milik kecamatannya sendiri — divalidasi server di setiap aksi edit/hapus.
- Kuota Apps Script gratis ±20.000 panggilan/hari; snapshot offline mengurangi panggilan; pecah sheet per tahun ajaran bila `GURU` >50.000 baris.
