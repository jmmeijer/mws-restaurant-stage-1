importScripts('./js/idb.js');
importScripts('./js/dbhelper.js');

var staticCacheName = 'rra-static-v1';
var contentImgsCache = 'rra-content-imgs';
var allCaches = [staticCacheName, contentImgsCache];

self.addEventListener('install',  event => {
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

self.addEventListener('activate',  event => {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith('rra-') && !allCaches.includes(cacheName);
    }).map(function (cacheName) {
      return caches['delete'](cacheName);
    }));
  }));
});

self.addEventListener('fetch',  event => {
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
   
 if(requestUrl.href.startsWith('http://localhost:1337')){

     console.log('Calling API');
     
    if (requestUrl.pathname.startsWith('/restaurants')) {
        
        
        event.respondWith(async function() {
            return await fetch(event.request);
        }());
/*
        console.log(requestUrl.search);
        URLSearchParams.has('is_favorite'){
            console.log(requestUrl.searchParams.get('is_favorite'));
        }
*/
    }else{
     event.respondWith(showCachedRestaurants(event.request));
    }
     return;
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

self.addEventListener('sync', event => {
  console.log('and were back online!');
  if (event.tag == 'reviews') {
      console.log('event tag: ', event.tag);
      event.waitUntil(postQueuedReviews());
      console.log('Finished Sync!');
  }
});

// https://developer.mozilla.org/en-US/docs/Web/API/IDBCursor/update

postQueuedReviews = async () => {
  return await idb.open('restaurants', 2).then( db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      //const syncedIndex = store.index('synced');
        
      return store.openCursor();

    }).then(async function syncReview(cursor) {
      if (!cursor) return;
      console.log('Cursor at: ', cursor.value);
      console.log('Synced: ', cursor.value.synced);
      
      if(cursor.value.synced === false){
        var review = cursor.value;
        console.log('This review has not been synced yet: ', review);
        review.synced = true;
          
        DBHelper.postReview(review).then(syncedReview => {
          console.log('Review has been posted: ', syncedReview);

          return syncedReview;
          //return cursor.continue().then(syncReview);
        }).catch( error => {
            console.error('Error: ', error.message);
        });
          
        cursor.update(review).then(()=>{
            console.log('Updated review in idb record');
        }).catch( error => {
            console.error('Error: ', error.message);
        });
      }
      return cursor.continue().then(syncReview);
    }).then(function() {
      console.log('Done cursoring');
      return 'done!';
    }).catch(error=> {
      console.error('Error: ', error.message);
    });
}


function showCachedRestaurants(request){
    console.log(request);
    
    return fetch(request).catch(function(error) {
        console.error('Fetching failed:', error);
        throw error;
      });
    
}

function serveIMG(request) {
  var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');

  return caches.open(contentImgsCache).then(function (cache) {
    return cache.match(storageUrl).then(function (response) {
      if (response) return response;

      return fetch(request).then(function (response) {
        cache.put(storageUrl, response.clone());
        return response;
      }).catch(function(error) {
        console.error('Fetching failed:', error);
        throw error;
      });
    });
  });
}