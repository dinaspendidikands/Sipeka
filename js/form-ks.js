/* SIPEKA — render & submit form penilaian kepala sekolah
   window.JENIS_FORM = 'sdsmp' | 'paud' (di-set oleh halaman)
   Fitur: identitas dapat diperbaiki, draft otomatis (tidak hilang saat
   internet mati), antrean kirim ulang otomatis saat online kembali. */
(function () {
  /* wajib login sebagai PENGAWAS; hanya sekolah binaan yang bisa dinilai */
  if (!Pengguna.wajib('pengawas')) return;
  const akun = Pengguna.data;
  if (akun.wajibGanti) { location.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop()); return; }
  const paud = window.JENIS_FORM === 'paud';
  const kunciDraft = paud ? 'paud' : 'sdsmp';
  const aksiSubmit = paud ? 'submitpaud' : 'submitks';
  const kelompok = paud ? KS_PAUD_KELOMPOK : KS_SDSMP_KELOMPOK;
  let masterSekolah = [];

  function render() {
    const c = $id('konten');
    let html = `
    <div id="akunBar"></div>
    <div id="antrean"></div>
    <div id="infoDraft"></div>
    <div class="kartu">
      <h3><span class="no">1</span>Identitas Sekolah & Penilai
        <span class="tag tag-kuning" style="margin-left:.5rem">✏️ semua kolom dapat diperbaiki jika ada kesalahan</span></h3>
      <div class="baris">
        <div><label>Email Penilai (Pengawas)</label><input type="email" id="email" placeholder="nama@dinas.belajar.id" required></div>
        <div><label>Pilih dari Master — Kecamatan</label><select id="kecamatan"></select></div>
        <div><label>Pilih dari Master — Sekolah</label><select id="sekolah"></select></div>
      </div>
      <p class="info info-biru" style="margin:.6rem 0">Memilih sekolah akan mengisi kolom di bawah secara otomatis.
        Jika ada data yang keliru (NPSN, nama sekolah, kepala sekolah, pengawas, no. HP, dll), <b>perbaiki langsung di kolomnya</b> — data yang dikirim adalah isi kolom di bawah.
        Sekolah tidak ada di daftar? Pilih <b>"✏️ Ketik manual"</b> lalu isi identitas sendiri.</p>
      <div class="baris">
        <div><label>NPSN</label><input id="npsn" placeholder="NPSN sekolah"></div>
        <div><label>Nama Sekolah</label><input id="namaSekolah" placeholder="nama sekolah"></div>
        <div><label>Jenjang Sekolah</label><input id="jenjang" placeholder="${paud ? 'TK / PAUD' : 'SD / SMP'}"></div>
        <div><label>Kecamatan</label><input id="namaKecamatan" placeholder="kecamatan"></div>
      </div>
      <div class="baris">
        <div><label>Nama Kepala Sekolah</label><input id="ks"></div>
        <div><label>Nomor HP Kepala Sekolah</label><input id="hpKS"></div>
        <div><label>NIP Kepala Sekolah</label><input id="nipKS" placeholder="NIP kepala sekolah"></div>
        <div><label>Nama Pengawas 🔒</label><input id="pengawas" readonly title="Diambil dari akun pengawas yang login — tidak dapat diedit"></div>
        <div><label>Nomor HP Pengawas</label><input id="hpPengawas"></div>
        <div><label>NIP Pengawas 🔒</label><input id="nipPengawas" readonly title="Diambil dari akun pengawas (username) — tidak dapat diedit"></div>
      </div>
      <p class="info info-kuning" style="margin:.6rem 0">🔄 Perbaikan pada kolom identitas di atas akan <b>memperbarui data sekolah di MASTER_SEKOLAH</b> secara otomatis saat penilaian dikirim.</p>
      <div class="baris">
        ${paud ? '' : `<div><label>Periode Penilaian</label><select id="periode">${TW_LIST.map(t=>`<option>${t}</option>`).join('')}</select></div>`}
        <div><label>Bulan</label><select id="bulan">${BULAN_LIST.map(b=>`<option>${b}</option>`).join('')}</select></div>
        <div><label>Minggu</label><select id="minggu">${MINGGU_LIST.map(m=>`<option>${m}</option>`).join('')}</select></div>
      </div>
    </div>`;

    let no = 2, idx = 0;
    kelompok.forEach(g => {
      html += `<div class="kartu"><h3><span class="no">${no++}</span>${esc(g.nama)}</h3>
      <div style="overflow-x:auto"><table>
        <tr><th style="width:42%">Indikator</th><th>Baseline</th><th>Target</th><th>Capaian</th><th style="width:26%">Link Dokumentasi (Google Drive)</th></tr>`;
      g.indikator.forEach(ind => {
        const opsi = [1,2,3,4,5].map(v => `<option>${v}</option>`).join('');
        html += `<tr>
          <td><b>${ind.kode}</b> ${esc(ind.nama)}</td>
          <td><select id="b${idx}" required><option value="">—</option>${opsi}</select></td>
          <td><select id="t${idx}" required><option value="">—</option>${opsi}</select></td>
          <td><select id="c${idx}" required><option value="">—</option>${opsi}</select></td>
          <td><input id="l${idx}" type="url" placeholder="https://drive.google.com/..."></td>
        </tr>`;
        idx++;
      });
      html += '</table></div></div>';
    });

    html += `
    <div class="kartu">
      <h3><span class="no">${no}</span>Catatan dan Rekomendasi</h3>
      <textarea id="catatan" rows="3" placeholder="Catatan pengawas untuk kepala sekolah..."></textarea>
    </div>
    <div style="text-align:right">
      <span id="ringkas" style="margin-right:1rem;color:var(--abu);font-size:.88rem"></span>
      <button class="btn btn-abu" id="hapusDraft" type="button">🗑 Kosongkan Isian</button>
      <button class="btn btn-biru" id="kirim">📤 Kirim Penilaian</button>
    </div>`;
    c.innerHTML = html;

    $id('kecamatan').onchange = isiSekolah;
    $id('sekolah').onchange = isiIdentitas;
    $id('kirim').onclick = kirim;
    $id('hapusDraft').onclick = async () => {
      if (!confirm('Kosongkan seluruh isian formulir ini?')) return;
      await Draft.hapus(kunciDraft);
      location.reload();
    };
    barAkun($id('akunBar'), 'Pengawas — hanya sekolah binaan Anda yang tampil');
    kunciPengawas();
    const simpanDraft = debounce(async () => {
      await Draft.simpan(kunciDraft, formKeObjek(c));
      $id('infoDraft').innerHTML = `<div class="info info-hijau">💾 Isian tersimpan otomatis di perangkat ini (${new Date().toLocaleTimeString('id-ID')}) — aman walau internet terputus.</div>`;
    }, 800);
    c.addEventListener('change', () => { hitungRingkas(); simpanDraft(); });
    c.addEventListener('input', simpanDraft);
  }

  async function muatMaster() {
    try {
      masterSekolah = (await apiGet('master')).sekolah;
    } catch (e) {
      const s = await Snapshot.muat().catch(() => null);
      if (s && s.master) {
        masterSekolah = s.master.sekolah;
        $id('pesan').innerHTML = '<div class="info info-kuning">📶 Offline — daftar sekolah dimuat dari snapshot. Anda tetap bisa mengisi & mengirim; jika gagal terkirim, isian masuk antrean kirim ulang.</div>';
      } else {
        $id('pesan').innerHTML = `<div class="info info-kuning">Tidak dapat memuat master data (${esc(e.message)}).<br>
          Anda <b>tetap bisa mengisi formulir</b> — ketik identitas sekolah secara manual di kolom yang tersedia. Isian tersimpan otomatis dan dapat dikirim ulang saat koneksi pulih.</div>`;
      }
    }
    if (!masterSekolah.length && akun.binaan) masterSekolah = akun.binaan; // cadangan dari sesi login
    masterSekolah = masterSekolah.filter(s => {
      const j = String(s.jenjang).toUpperCase();
      const isSDSMP = j === 'SD' || j === 'SMP';
      const binaan = String(s.pengawas || '').trim().toLowerCase() === String(akun.nama || '').trim().toLowerCase();
      return binaan && (paud ? !isSDSMP : isSDSMP);
    });
    const MANUAL = { value: '__manual', label: '✏️ Ketik manual (tidak ada di daftar)' };
    isiSelect($id('kecamatan'),
      [MANUAL].concat([...new Set(masterSekolah.map(s => s.kecamatan))].sort().map(k => ({ value: k, label: k }))),
      '— pilih kecamatan —');
    isiSelect($id('sekolah'), [MANUAL], '— pilih kecamatan dahulu —');
    await pulihkanDraft();
    tampilAntrean();
  }
  function isiSekolah() {
    const MANUAL = { value: '__manual', label: '✏️ Ketik manual (tidak ada di daftar)' };
    if ($id('kecamatan').value === '__manual') {
      isiSelect($id('sekolah'), [MANUAL], null);
      $id('sekolah').value = '__manual';
      modeManual();
      return;
    }
    isiSelect($id('sekolah'),
      [MANUAL].concat(masterSekolah.filter(s => s.kecamatan === $id('kecamatan').value)
        .map(s => ({ value: s.npsn, label: s.sekolah }))),
      '— pilih sekolah —');
  }
  /* nama & NIP pengawas SELALU dari akun login (AKUN_PENGAWAS) — terkunci */
  function kunciPengawas() {
    $id('pengawas').value = akun.nama || '';
    $id('nipPengawas').value = akun.username || ''; // username pengawas = NIP
    if (!$id('hpPengawas').value) $id('hpPengawas').value = akun.hp || '';
  }
  function modeManual() {
    // kosongkan kolom identitas agar diketik manual (kecuali identitas pengawas yang terkunci)
    ['npsn','namaSekolah','jenjang','namaKecamatan','ks','hpKS','nipKS'].forEach(k => $id(k).value = '');
    kunciPengawas();
    if ($id('kecamatan').value && $id('kecamatan').value !== '__manual') $id('namaKecamatan').value = $id('kecamatan').value;
    tampilNotif('Mode ketik manual: isi NPSN, nama sekolah, dan identitas lainnya — sekolah baru akan otomatis terdaftar di MASTER_SEKOLAH saat penilaian dikirim.');
    $id('npsn').focus();
  }
  function isiIdentitas() {
    if ($id('sekolah').value === '__manual') { modeManual(); return; }
    const s = masterSekolah.find(x => x.npsn === $id('sekolah').value);
    if (!s) return;
    $id('npsn').value = s.npsn; $id('namaSekolah').value = s.sekolah;
    $id('jenjang').value = s.jenjang; $id('namaKecamatan').value = s.kecamatan;
    $id('ks').value = s.ks; $id('hpKS').value = s.hpKS;
    $id('hpPengawas').value = s.hpPengawas || akun.hp || '';
    $id('nipKS').value = s.nipKS || '';
    kunciPengawas(); // nama & NIP pengawas selalu dari akun login
  }
  function hitungRingkas() {
    const n = flatIndikator(kelompok).length;
    let sb = 0, sc = 0, lengkap = true;
    for (let i = 0; i < n; i++) {
      const b = $id('b' + i).value, c = $id('c' + i).value;
      if (!b || !c || !$id('t' + i).value) { lengkap = false; continue; }
      sb += +b; sc += +c;
    }
    $id('ringkas').textContent = lengkap
      ? `Rata Baseline ${f2(sb/n)} · Rata Capaian ${f2(sc/n)} · Kinerja ${f2((sc-sb)/n)}` : '';
  }

  async function pulihkanDraft() {
    const d = await Draft.muat(kunciDraft).catch(() => null);
    if (!d) return;
    // pulihkan pilihan master dulu agar opsi sekolah terisi, lalu seluruh nilai
    if (d._f && d._f.kecamatan) { $id('kecamatan').value = d._f.kecamatan; isiSekolah(); }
    objekKeForm($id('konten'), d);
    kunciPengawas(); // jangan biarkan draft menimpa identitas pengawas terkunci
    hitungRingkas();
    $id('infoDraft').innerHTML = `<div class="info info-hijau">♻️ Isian sebelumnya dipulihkan otomatis (tersimpan ${new Date(d._waktu).toLocaleString('id-ID')}). Lanjutkan pengisian, atau tekan "Kosongkan Isian" untuk mulai baru.</div>`;
  }

  // ---------- antrean kirim ulang ----------
  async function tampilAntrean() {
    const q = (await Outbox.semua()).filter(x => x.action === aksiSubmit || true);
    const el = $id('antrean');
    if (!q.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="info info-kuning">📨 <b>${q.length} penilaian</b> menunggu di antrean (gagal terkirim sebelumnya).
      <button class="btn btn-kuning" style="padding:.3rem .9rem;margin-left:.6rem" id="btnKirimUlang">Kirim Ulang Sekarang</button></div>`;
    $id('btnKirimUlang').onclick = kirimUlang;
  }
  async function kirimUlang() {
    const btn = $id('btnKirimUlang');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="muat"></span> Mengirim…'; }
    const r = await Outbox.kirimSemua();
    if (r.terkirim) tampilNotif(`✅ ${r.terkirim} penilaian dari antrean berhasil terkirim.` + (r.gagal ? ` ${r.gagal} masih menunggu.` : ''));
    else if (r.gagal) tampilNotif('Belum berhasil — antrean akan dicoba lagi saat koneksi pulih.', true);
    tampilAntrean();
  }
  window.addEventListener('online', kirimUlang);

  async function kirim() {
    const n = flatIndikator(kelompok).length;
    if (!$id('email').value) return tampilNotif('Email penilai wajib diisi', true);
    if (!$id('npsn').value || !$id('namaSekolah').value) return tampilNotif('NPSN dan Nama Sekolah wajib diisi (pilih dari master atau ketik manual)', true);
    const nilai = [];
    for (let i = 0; i < n; i++) {
      const b = $id('b'+i).value, t = $id('t'+i).value, c = $id('c'+i).value;
      if (!b || !t || !c) return tampilNotif(`Indikator ke-${i+1} belum lengkap (Baseline/Target/Capaian)`, true);
      nilai.push({ b: +b, t: +t, c: +c, link: $id('l'+i).value.trim() || '-' });
    }
    // identitas diambil dari kolom isian (yang sudah bisa diperbaiki pengguna)
    const data = {
      ident: {
        email: $id('email').value.trim(), npsn: $id('npsn').value.trim(),
        kecamatan: $id('namaKecamatan').value.trim(), jenjang: $id('jenjang').value.trim(),
        sekolah: $id('namaSekolah').value.trim(), pengawas: $id('pengawas').value.trim(),
        hpPengawas: $id('hpPengawas').value.trim(), ks: $id('ks').value.trim(), hpKS: $id('hpKS').value.trim(),
        nipKS: $id('nipKS').value.trim(), nipPengawas: $id('nipPengawas').value.trim(),
        periode: paud ? '' : $id('periode').value, bulan: $id('bulan').value, minggu: $id('minggu').value
      },
      nilai, catatan: $id('catatan').value.trim()
    };
    const btn = $id('kirim');
    btn.disabled = true; btn.innerHTML = '<span class="muat"></span> Mengirim...';
    try {
      const r = await apiPost(aksiSubmit, { data, auth: Pengguna.auth });
      await Draft.hapus(kunciDraft);
      $id('konten').innerHTML = `<div class="kartu" style="text-align:center;padding:3rem">
        <div style="font-size:3rem">✅</div>
        <h3>Penilaian berhasil disimpan</h3>
        <p style="color:var(--abu)">${esc(data.ident.sekolah)} — ${esc(data.ident.bulan)} Minggu ${esc(data.ident.minggu)}<br>
        Rata Capaian: <b>${f2(r.rataCapaian)}</b> · Kinerja (Capaian−Baseline): <b>${f2(r.kinerja)}</b></p>
        <p style="margin-top:1.2rem">
          <a class="btn btn-biru" href="${location.pathname.split('/').pop()}">Isi Penilaian Lain</a>
          <a class="btn btn-abu" href="rapor.html">Cetak Rapor</a>
        </p></div>`;
      scrollTo(0, 0);
    } catch (e) {
      // gagal (internet mati / padat / server) → simpan ke antrean, isian tetap aman
      await Outbox.tambah({ action: aksiSubmit, data, auth: Pengguna.auth, ket: data.ident.sekolah + ' — ' + data.ident.bulan });
      await Draft.hapus(kunciDraft);
      tampilNotif('⚠ Gagal terkirim (' + e.message + '). Penilaian disimpan di antrean dan akan dikirim ulang otomatis saat koneksi pulih.', true);
      btn.disabled = false; btn.innerHTML = '📤 Kirim Penilaian';
      tampilAntrean();
      scrollTo(0, 0);
    }
  }

  window.tampilNotif = function (pesan, merah) {
    const n = $id('notif');
    n.textContent = pesan; n.style.display = 'block';
    n.style.background = merah ? 'var(--merah)' : 'var(--biru-tua)';
    setTimeout(() => n.style.display = 'none', 6000);
  };

  render();
  muatMaster();
})();
