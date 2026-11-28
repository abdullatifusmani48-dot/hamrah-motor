const CACHE_NAME = 'hamrah-motor-v7';

const APP_FILES = [
 './',
 './index.html',
 './manifest.json',
 './sw.js'
];

self.addEventListener('install', event => {
 event.waitUntil(
  caches.open(CACHE_NAME)
   .then(cache => cache.addAll(APP_FILES))
   .then(() => self.skipWaiting())
 );
});

self.addEventListener('activate', event => {
 event.waitUntil(
  caches.keys()
   .then(names => Promise.all(
    names
     .filter(name =>
      name.startsWith('hamrah-motor-') &&
      name !== CACHE_NAME
     )
     .map(name => caches.delete(name))
   ))
   .then(() => self.clients.claim())
 );
});

self.addEventListener('fetch', event => {

 const request = event.request;

 if(request.method !== 'GET') return;

 const url = new URL(request.url);

 if(url.origin !== self.location.origin) return;

 if(request.mode === 'navigate'){

  event.respondWith(
   fetch(request)
    .then(response => {
     if(response && response.ok){
      const copy=response.clone();
      caches.open(CACHE_NAME)
       .then(cache=>cache.put('./index.html',copy));
     }
     return response;
    })
    .catch(() =>
     caches.match('./index.html')
      .then(response=>response || caches.match('./'))
    )
  );

  return;
 }

 event.respondWith(
  caches.match(request).then(cached=>{
   if(cached) return cached;

   return fetch(request).then(response=>{
    if(response && response.ok){
     const copy=response.clone();
     caches.open(CACHE_NAME)
      .then(cache=>cache.put(request,copy));
    }
    return response;
   });
  })
 );
});