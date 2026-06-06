const CACHE_NAME = 'groove-slip-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/_next/static/css/',
]

// Install — cache shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(['/'])
    })
  )
  self.skipWaiting()
})

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch — network first, cache fallback
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and API requests
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, cloned)
          })
        }
        return response
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(request).then(cached => {
          if (cached) return cached
          // Offline fallback for navigation
          if (request.mode === 'navigate') {
            return caches.match('/')
          }
        })
      })
  )
})