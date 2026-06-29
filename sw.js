/* SIPEKA service worker — cache app shell agar bisa dibuka offline */
const CACHE = 'sipeka-v22';
const SHELL = [
  './', 'index.html', 'form-ks-sd-smp.html', 'form-ks-paud.html', 'form-guru.html',
  'rapor.html', 'dashboard.html', 'admin.html', 'login.html', 'hasil-penilaian.html', 'kelola-master.html', 'cari-sekolah.html',
  'css/app.css', 'js/config.js', 'js/indikator.js', 'js/form-ks.js',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  // API Apps Script: network-first (fallback ditangani aplikasi via snapshot IndexedDB)
  if (url.includes('script.google.com')) return;
  // Aset: cache-first
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit ||
      fetch(e.request).then(r => {
        if (r.ok && (url.startsWith(self.location.origin) || url.includes('cdnjs'))) {
          const klon = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, klon));
        }
        return r;
      }).catch(() => caches.match('index.html'))
    )
  );
});
