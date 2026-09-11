// Service worker بسيط: يخزن الصفحة الرئيسية وأصول التطبيق كاش أول مرة تفتح فيها
// بعدها يفتح الموقع حتى بدون إنترنت (Cache First مع رجوع للشبكة لو الملف غير مخزن)
const CACHE_NAME = 'cafesayf-cache-v1'

self.addEventListener('install', (event) => {
  // نشتق مسار الأساس (basePath) من نطاق تسجيل service worker نفسه، حتى يشتغل
  // بشكل صحيح سواء نُشر الموقع على جذر الدومين أو تحت مسار فرعي (مثل GitHub Pages)
  const base = new URL(self.registration.scope).pathname.replace(/\/$/, '')
  const appShell = [base + '/', base + '/manifest.json']
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(appShell)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)

      return cached || network
    })
  )
})
