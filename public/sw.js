// Service Worker for Web Push Notifications
const CACHE_NAME = 'samp-rtc-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
                            return cache.addAll([
                      '/',
                      '/index.html',
                      '/icon.png'
                    ]);
      })
      .then(() => {
        console.log('Service Worker installed and cached static assets');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated and cleaned up old caches');
        return self.clients.claim();
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
                        const options = {
                    body: data.body || 'You have a new notification',
                    icon: '/icon.png',
                    tag: data.tag || 'general',
                    data: data.data || {},
                    requireInteraction: data.requireInteraction || false,
                    actions: data.actions || [],
                    vibrate: data.vibrate || [200, 100, 200],
                    silent: false
                  };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Samp-rtc', options)
      );
    } catch (error) {
      console.error('Error parsing push data:', error);
      
                        // Fallback notification
                  const options = {
                    body: 'You have a new notification',
                    icon: '/icon.png'
                  };

      event.waitUntil(
        self.registration.showNotification('Samp-rtc', options)
      );
    }
  }
});

// Notification click event - handle notification taps
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions if needed
  } else {
    // Default behavior - focus or open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window/tab open with the app
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If no window/tab is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Background sync event - handle offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('Processing background sync...')
    );
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Message received in Service Worker:', event);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    // API requests - network first, fallback to cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
  } else if (url.pathname.startsWith('/static/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    // Static assets - cache first, fallback to network
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request);
        })
    );
  } else {
    // Other requests - network first
    event.respondWith(fetch(request));
  }
});

// Error event - handle service worker errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event);
});

// Unhandled rejection event - handle unhandled promises
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event);
});

console.log('Service Worker script loaded');
