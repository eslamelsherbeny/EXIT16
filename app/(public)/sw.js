const CACHE_NAME = 'aqar-exit-pwa-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // التمرير المباشر للشبكة لضمان حداثة بيانات العقارات والـ Server Actions دائماً
  if (event.request.method !== 'GET') return
})