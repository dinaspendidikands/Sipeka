/* ============================================================
   SIPEKA — Konfigurasi & util bersama
   GANTI API_URL dengan URL deploy Apps Script Anda (lihat README)
   ============================================================ */
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbx34jW4d1tNMwkV1KdvWlA2ZlCKIE5-A9oQyTer7knfDhwz2juSIX27DtbIR5-9fJCUlg/exec', // contoh: https://script.google.com/macros/s/AKfycb.../exec
  VERSI: '1.0'
};

// ---------- Panggilan API ----------
async function apiGet(action, params = {}) {
  const u = new URL(CONFIG.API_URL);
  u.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  const r = await fetch(u, { method: 'GET' });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j;
}
async function apiPost(action, body = {}) {
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
  wajib() { if (!this.aktif) { location.href = 'admin.html?next=' + encodeURIComponent(location.pathname.split('/').pop()); return false; } return true; },
  keluar() { this.token = null; location.href = 'index.html'; }
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
        await apiPost(item.action, { data: item.data });
        await this.hapus(item._id);
        terkirim++;
      } catch (e) { /* biarkan di antrean, coba lagi nanti */ }
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
