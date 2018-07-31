var staticCacheName = 'rra-static-v1';
var contentImgsCache = 'rra-content-imgs';
var allCaches = [staticCacheName, contentImgsCache];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(staticCacheName).then(function (cache) {
    return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        '/js/app.js',
        '/js/idb.js',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/css/styles.css'
    ]);
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith('rra-') && !allCaches.includes(cacheName);
    }).map(function (cacheName) {
      return caches['delete'](cacheName);
    }));
  }));
});

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/img/')) {
      event.respondWith(serveIMG(event.request));
      return;
    }
    if (requestUrl.pathname.startsWith('/restaurant.html')) {
      event.respondWith(caches.match("/restaurant.html"));
      return;
    }
  }

  event.respondWith(caches.match(event.request, {ignoreSearch: true}).then(function (response) {
    return response || fetch(event.request).then(function(response) {
        return response;
      }).catch(function(error) {
        console.error('Fetching failed:', error);
        throw error;
      });
  }));
});

function serveIMG(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache).then(function (cache) {
    return cache.match(storageUrl).then(function (response) {
      if (response) return response;

      return fetch(request).then(function (networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      }).catch(function(error) {
        console.error('Fetching failed:', error);
        throw error;
      });
    });
  });
}