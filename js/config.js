/* ============================================================
   SIPEKA — Konfigurasi & util bersama
   GANTI API_URL dengan URL deploy Apps Script Anda (lihat README)
   ============================================================ */
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbx34jW4d1tNMwkV1KdvWlA2ZlCKIE5-A9oQyTer7knfDhwz2juSIX27DtbIR5-9fJCUlg/exec', // contoh: https://script.google.com/macros/s/AKfycb.../exec
  VERSI: '1.0'
};

// ---------- Mode Online/Offline ----------
const Mode = {
  /* 'auto' = ikuti kondisi jaringan; 'offline' = dipaksa offline (pakai snapshot) */
  get paksa() { return localStorage.getItem('sipeka_mode') || 'auto'; },
  set paksa(v) { localStorage.setItem('sipeka_mode', v); },
  get aktifOffline() { return this.paksa === 'offline' || !navigator.onLine; }
};
/* saklar mode untuk halaman dashboard & rapor */
function pasangToggleMode(el) {
  if (!el) return;
  const offline = Mode.aktifOffline;
  el.innerHTML = `
    <span class="mode-status ${offline ? 'mode-off' : 'mode-on'}">
      ${offline ? '📴 OFFLINE' : '🟢 ONLINE'}${Mode.paksa === 'offline' ? ' (dipaksa)' : !navigator.onLine ? ' (tidak ada jaringan)' : ''}
    </span>
    <label class="mode-saklar" title="Paksa mode offline: data diambil dari snapshot, tanpa internet">
      <input type="checkbox" id="cbModeOffline" ${Mode.paksa === 'offline' ? 'checked' : ''}>
      <span>Mode Offline</span>
    </label>`;
  el.querySelector('#cbModeOffline').onchange = e => {
    Mode.paksa = e.target.checked ? 'offline' : 'auto';
    location.reload();
  };
}

// ---------- Panggilan API ----------
async function apiGet(action, params = {}) {
  if (Mode.aktifOffline) throw new Error('Mode offline aktif — data diambil dari snapshot perangkat');
  const u = new URL(CONFIG.API_URL);
  u.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  const r = await fetch(u, { method: 'GET' });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j;
}
async function apiPost(action, body = {}) {
  if (Mode.aktifOffline) throw new Error('Mode offline aktif — kiriman disimpan di antrean perangkat');
  // Content-Type text/plain agar tidak kena preflight CORS Apps Script
  const r = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...body })
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j;
}

// ---------- Sesi admin ----------
const Admin = {
  get token() { return sessionStorage.getItem('sipeka_token'); },
  set token(t) { t ? sessionStorage.setItem('sipeka_token', t) : sessionStorage.removeItem('sipeka_token'); },
  get aktif() { return !!this.token; },
  /* sesi offline: login diverifikasi lokal, hanya bisa baca snapshot */
  get offlineSesi() { return this.token === 'OFFLINE'; },
  wajib() { if (!this.aktif) { location.href = 'admin.html?next=' + encodeURIComponent(location.pathname.split('/').pop()); return false; } return true; },
  keluar() { this.token = null; location.href = 'index.html'; }
};

// ---------- Sesi pengguna (pengawas / kepala sekolah) ----------
const Pengguna = {
  get data() { try { return JSON.parse(localStorage.getItem('sipeka_user')); } catch (e) { return null; } },
  set data(v) { v ? localStorage.setItem('sipeka_user', JSON.stringify(v)) : localStorage.removeItem('sipeka_user'); },
  get aktif() { return !!this.data; },
  get auth() { const d = this.data; return d ? { peran: d.peran, username: d.username, kunci: d.kunci } : null; },
  /* wajib login dgn peran tertentu; jika belum, arahkan ke halaman login */
  wajib(peran) {
    const d = this.data;
    if (!d || d.peran !== peran) {
      location.href = 'login.html?peran=' + peran + '&next=' + encodeURIComponent(location.pathname.split('/').pop());
      return false;
    }
    return true;
  },
  keluar() { this.data = null; location.href = 'login.html'; }
};
/* bilah info akun di atas form */
function barAkun(el, keterangan) {
  const d = Pengguna.data;
  if (!el || !d) return;
  el.innerHTML = `<div class="info info-biru" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem">
    <span>👤 <b>${esc(d.nama)}</b> — ${esc(keterangan)} (username: ${esc(d.username)})</span>
    <span><a href="login.html" style="font-weight:700">Ganti Password</a> &nbsp;|&nbsp;
    <a href="#" onclick="Pengguna.keluar();return false" style="font-weight:700;color:var(--merah)">Keluar</a></span></div>`;
}

/* hash SHA-256 hex untuk verifikasi login offline (fallback bila crypto.subtle tak tersedia) */
async function sha256Hex(s) {
  if (crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0x811c9dc5, h2 = 0x1000193; // fallback sederhana (non-https lokal)
  for (const c of s) { h1 = (h1 ^ c.charCodeAt(0)) * 16777619 >>> 0; h2 = (h2 + c.charCodeAt(0)) * 31 >>> 0; }
  return 'fb' + h1.toString(16) + h2.toString(16);
}
/* simpan/cek kunci login offline di perangkat ini */
const LoginOffline = {
  async simpan(password) { await idbSet('adminKunci', await sha256Hex(password)); },
  async cocok(password) {
    const k = await idbGet('adminKunci').catch(() => null);
    return !!k && k === await sha256Hex(password);
  },
  async ada() { return !!(await idbGet('adminKunci').catch(() => null)); }
};

// ---------- IndexedDB: snapshot offline ----------
function idb() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open('sipeka', 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function idbSet(key, val) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', 'readwrite');
    tx.objectStore('kv').put(val, key);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((res, rej) => {
    const rq = db.transaction('kv').objectStore('kv').get(key);
    rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
  });
}

const Snapshot = {
  async simpan(data) { data._waktu = new Date().toISOString(); await idbSet('snapshot', data); },
  async muat() { return await idbGet('snapshot'); }
};

// ---------- Draft form (autosave agar isian tidak hilang) ----------
const Draft = {
  async simpan(kunci, data) { data._waktu = new Date().toISOString(); await idbSet('draft_' + kunci, data); },
  async muat(kunci) { return await idbGet('draft_' + kunci); },
  async hapus(kunci) { await idbSet('draft_' + kunci, null); }
};

// ---------- Antrean kirim ulang (saat gagal kirim / offline) ----------
const Outbox = {
  async semua() { return (await idbGet('outbox')) || []; },
  async tambah(item) {
    const q = await this.semua();
    item._id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    item._waktu = new Date().toISOString();
    q.push(item);
    await idbSet('outbox', q);
    return q.length;
  },
  async hapus(id) {
    const q = (await this.semua()).filter(x => x._id !== id);
    await idbSet('outbox', q);
    return q.length;
  },
  /* coba kirim semua isi antrean; kembalikan {terkirim, gagal} */
  async kirimSemua() {
    let q = await this.semua(), terkirim = 0;
    for (const item of [...q]) {
      try {
        await apiPost(item.action, { data: item.data, auth: item.auth || (Pengguna.aktif ? Pengguna.auth : null) });
        await this.hapus(item._id);
        terkirim++;
      } catch (e) {
        if (/login|sesi|berhak|binaan|satuan pendidikan/i.test(String(e.message))) {
          /* ditolak server karena hak akses — jangan tahan selamanya */
          item._galat = e.message;
        }
      }
    }
    return { terkirim, gagal: (await this.semua()).length };
  }
};

// serialisasi seluruh input/select/textarea (id) + radio (name) dalam kontainer
function formKeObjek(container) {
  const data = { _f: {}, _r: {} };
  container.querySelectorAll('input[id],select[id],textarea[id]').forEach(el => {
    if (el.type === 'radio') return;
    data._f[el.id] = el.value;
  });
  container.querySelectorAll('input[type=radio]:checked').forEach(el => { data._r[el.name] = el.value; });
  return data;
}
function objekKeForm(container, data) {
  if (!data) return;
  Object.entries(data._f || {}).forEach(([id, v]) => { const el = container.querySelector('#' + CSS.escape(id)); if (el) el.value = v; });
  Object.entries(data._r || {}).forEach(([nama, v]) => {
    const el = container.querySelector(`input[name="${nama}"][value="${v}"]`); if (el) el.checked = true;
  });
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

// ---------- Pengaturan (kategori, kelompok baseline) ----------
let _pengaturan = null;
async function getPengaturan() {
  if (_pengaturan) return _pengaturan;
  try {
    const j = await apiGet('pengaturan');
    _pengaturan = Object.assign({}, PENGATURAN_DEFAULT, j.pengaturan || {});
  } catch (e) {
    const s = await Snapshot.muat().catch(() => null);
    _pengaturan = (s && s.pengaturan) ? Object.assign({}, PENGATURAN_DEFAULT, s.pengaturan) : PENGATURAN_DEFAULT;
  }
  return _pengaturan;
}

// ---------- Util ----------
const $id = id => document.getElementById(id);
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function angka(v) { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
function f2(n) { return (Math.round(n * 100) / 100).toLocaleString('id-ID'); }
function isiSelect(sel, arr, placeholder) {
  sel.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : '') +
    arr.map(o => typeof o === 'string' ? `<option>${esc(o)}</option>` : `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join('');
}
function unduhTeks(nama, isi, tipe = 'text/csv') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(["﻿" + isi], { type: tipe + ';charset=utf-8' }));
  a.download = nama; a.click(); URL.revokeObjectURL(a.href);
}
function keCSV(headers, rows) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(q).join(';'), ...rows.map(r => r.map(q).join(';'))].join('\r\n');
}

// ---------- Service worker (offline) ----------
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
