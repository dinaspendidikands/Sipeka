/* SIPEKA — render & submit form penilaian kepala sekolah
   window.JENIS_FORM = 'sdsmp' | 'paud' (di-set oleh halaman) */
(function () {
  const paud = window.JENIS_FORM === 'paud';
  const kelompok = paud ? KS_PAUD_KELOMPOK : KS_SDSMP_KELOMPOK;
  let masterSekolah = [];

  function render() {
    const c = $id('konten');
    let html = `
    <div class="kartu">
      <h3><span class="no">1</span>Identitas Sekolah & Penilai</h3>
      <div class="baris">
        <div><label>Email Penilai (Pengawas)</label><input type="email" id="email" placeholder="nama@dinas.belajar.id" required></div>
        <div><label>Kecamatan</label><select id="kecamatan" required></select></div>
        <div><label>Nama Sekolah</label><select id="sekolah" required></select></div>
        <div><label>NPSN</label><input id="npsn" readonly></div>
      </div>
      <div class="baris">
        <div><label>Jenjang</label><input id="jenjang" readonly></div>
        <div><label>Nama Kepala Sekolah</label><input id="ks" readonly></div>
        <div><label>HP Kepala Sekolah</label><input id="hpKS" readonly></div>
        <div><label>Nama Pengawas</label><input id="pengawas" readonly></div>
        <div><label>HP Pengawas</label><input id="hpPengawas" readonly></div>
      </div>
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
      <button class="btn btn-biru" id="kirim">📤 Kirim Penilaian</button>
    </div>`;
    c.innerHTML = html;

    $id('kecamatan').onchange = isiSekolah;
    $id('sekolah').onchange = isiIdentitas;
    $id('kirim').onclick = kirim;
    c.addEventListener('change', hitungRingkas);
  }

  async function muatMaster() {
    try {
      const m = await apiGet('master');
      masterSekolah = m.sekolah.filter(s => {
        const j = String(s.jenjang).toUpperCase();
        const isSDSMP = j === 'SD' || j === 'SMP';
        return paud ? !isSDSMP : isSDSMP;
      });
      const kec = [...new Set(masterSekolah.map(s => s.kecamatan))].sort();
      isiSelect($id('kecamatan'), kec, '— pilih kecamatan —');
      isiSelect($id('sekolah'), [], '— pilih kecamatan dahulu —');
    } catch (e) {
      $id('pesan').innerHTML = `<div class="info info-merah">Gagal memuat master data: ${esc(e.message)}.<br>
        Pastikan terhubung internet dan API_URL pada <code>js/config.js</code> sudah diisi.</div>`;
    }
  }
  function isiSekolah() {
    const list = masterSekolah.filter(s => s.kecamatan === $id('kecamatan').value)
      .map(s => ({ value: s.npsn, label: s.sekolah }));
    isiSelect($id('sekolah'), list, '— pilih sekolah —');
    isiIdentitas();
  }
  function isiIdentitas() {
    const s = masterSekolah.find(x => x.npsn === $id('sekolah').value) || {};
    ['npsn','jenjang','ks','hpKS','pengawas','hpPengawas'].forEach(k => $id(k).value = s[k] || '');
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

  async function kirim() {
    const n = flatIndikator(kelompok).length;
    if (!$id('email').value || !$id('sekolah').value) return tampilNotif('Lengkapi identitas terlebih dahulu', true);
    const nilai = [];
    for (let i = 0; i < n; i++) {
      const b = $id('b'+i).value, t = $id('t'+i).value, c = $id('c'+i).value;
      if (!b || !t || !c) return tampilNotif(`Indikator ke-${i+1} belum lengkap (Baseline/Target/Capaian)`, true);
      nilai.push({ b: +b, t: +t, c: +c, link: $id('l'+i).value.trim() || '-' });
    }
    const s = masterSekolah.find(x => x.npsn === $id('sekolah').value);
    const data = {
      ident: {
        email: $id('email').value.trim(), npsn: s.npsn, kecamatan: s.kecamatan, jenjang: s.jenjang,
        sekolah: s.sekolah, pengawas: s.pengawas, hpPengawas: s.hpPengawas, ks: s.ks, hpKS: s.hpKS,
        periode: paud ? '' : $id('periode').value, bulan: $id('bulan').value, minggu: $id('minggu').value
      },
      nilai, catatan: $id('catatan').value.trim()
    };
    const btn = $id('kirim');
    btn.disabled = true; btn.innerHTML = '<span class="muat"></span> Mengirim...';
    try {
      const r = await apiPost(paud ? 'submitpaud' : 'submitks', { data });
      $id('konten').innerHTML = `<div class="kartu" style="text-align:center;padding:3rem">
        <div style="font-size:3rem">✅</div>
        <h3>Penilaian berhasil disimpan</h3>
        <p style="color:var(--abu)">${esc(s.sekolah)} — ${esc(data.ident.bulan)} Minggu ${esc(data.ident.minggu)}<br>
        Rata Capaian: <b>${f2(r.rataCapaian)}</b> · Kinerja (Capaian−Baseline): <b>${f2(r.kinerja)}</b></p>
        <p style="margin-top:1.2rem">
          <a class="btn btn-biru" href="${location.pathname.split('/').pop()}">Isi Penilaian Lain</a>
          <a class="btn btn-abu" href="rapor.html">Cetak Rapor</a>
        </p></div>`;
      scrollTo(0, 0);
    } catch (e) {
      tampilNotif('Gagal mengirim: ' + e.message, true);
      btn.disabled = false; btn.innerHTML = '📤 Kirim Penilaian';
    }
  }

  window.tampilNotif = function (pesan, merah) {
    const n = $id('notif');
    n.textContent = pesan; n.style.display = 'block';
    n.style.background = merah ? 'var(--merah)' : 'var(--biru-tua)';
    setTimeout(() => n.style.display = 'none', 4500);
  };

  render();
  muatMaster();
})();
