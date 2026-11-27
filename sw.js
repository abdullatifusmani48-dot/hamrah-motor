
const CACHE_NAME = 'hamrah-motor-v3';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json'
];

// نصب و ذخیره فایل‌های اصلی برنامه
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// فعال‌سازی نسخه جدید و پاک‌کردن حافظه نسخه‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith('hamrah-motor-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// مدیریت درخواست‌ها برای استفاده آفلاین
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // درخواست‌های خارج از سایت برنامه را مدیریت نکن
  if (url.origin !== self.location.origin) return;

  // برای صفحه اصلی، ابتدا نسخه شبکه و سپس نسخه ذخیره‌شده
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put('./index.html', copy);
            });
          }

          return response;
        })
        .catch(() =>
          caches.match('./index.html')
            .then(cached => cached || caches.match('./'))
        )
    );

    return;
  }

  // برای فایل‌های دیگر، ابتدا حافظه کش
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});
