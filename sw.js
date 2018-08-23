importScripts('/js/idb.js');
importScripts('/js/dbhelper.js');

var staticCacheName = 'rra-static-v1';
var contentImgsCache = 'rra-content-imgs';
var allCaches = [staticCacheName, contentImgsCache];

/*
function openDatabase() {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('restaurants', 1, upgradeDb => {
      switch(upgradeDb.oldVersion) {
        case 0:
          var store = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
          store.createIndex('cuisine', 'cuisine_type')
          store.createIndex('neighborhood', 'neighborhood');
      }
    });
}

const dbPromise = openDatabase();
*/

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


postQueuedReviews = async () => {
  return await idb.open('restaurants', 3).then( db => {
      const reviews = db.transaction('reviews')
        .objectStore('reviews');
        
      return reviews.getAll();

    }).then( reviews => {
        console.log('Reviews', reviews);
        if(reviews.length > 0){
            return reviews;
        }else{
          console.log('reviews array empty!');
          throw Error("No data");
        }
    })
    .then( reviews => {
        // Filter reviews by having synced attribute false
        const results = reviews.filter(r => r.synced == false);
      
      console.log('Reviews that are not synced: ', results);
      
        return results;
    }).catch(err => DBHelper.requestError(err))
      .then(reviews => {
      
console.log('Reviews that are not synced: ', reviews);

          reviews.map( async (review) => {
            await DBHelper.postReview(review).then(review => {

                console.log('Review has been posted: ', review);
                
            idb.open('restaurants', 2).then( db => {
              if(!db) return;

              const tx = db.transaction('reviews', 'readwrite');
              const store = tx.objectStore('reviews');
                
                review.synced = true;
                store.put(review);
                
                return review;
                
                }).then(review => {
                    console.log('Review has been stored in idb: ', review);
                });
            });
          });
            
        
        return reviews;
            
      })
      .catch(error=> {
        console.error('Error: ', error);
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