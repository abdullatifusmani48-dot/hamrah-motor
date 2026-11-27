
const CACHE_NAME = 'hamrah-motor-v5';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// نصب و ذخیره فایل‌های برنامه برای استفاده آفلاین
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// حذف کش‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name =>
            name.startsWith('hamrah-motor-') &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// مدیریت درخواست‌ها و نمایش نسخه آفلاین
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // فقط درخواست‌های همین برنامه مدیریت شوند
  if (url.origin !== self.location.origin) return;

  // برای فایل HTML ابتدا نسخه تازه و در نبود اینترنت نسخه کش‌شده
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
        .catch(() => {
          return caches.match('./index.html')
            .then(response => response || caches.match('./'));
        })
    );
    return;
  }

  // برای سایر فایل‌ها ابتدا کش و سپس شبکه
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
