'use strict';

/**
 * Common database helper functions.
 */
class DBHelper {
    
    static get dbPromise() {
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      }

      return idb.open('restaurants', 2, upgradeDb => {
          switch(upgradeDb.oldVersion) {
            case 0:
              var store = upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
              store.createIndex('cuisine', 'cuisine_type')
              store.createIndex('neighborhood', 'neighborhood');
            case 1:
              var store = upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
              store.createIndex('restaurant', 'restaurant_id')
          }
        });
    }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }
    
    /*
    * https://developers.google.com/web/updates/2015/03/introduction-to-fetch
    */
    
    static status(response) {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response)
      } else {
        return Promise.reject(new Error(response.statusText))
      }
    }

    static json(response) {
      return response.json()
    }

    static requestError(e, part) {
        console.log('Request failed', e);
    }

  /**
   * Fetch all restaurants.
   * Cache then network, see also: 
   * https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
   * https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/
   */
  static async fetchRestaurants() {
      
    var networkDataReceived = false;
      
      const networkUpdate = await fetch(DBHelper.DATABASE_URL+'restaurants')
        .then(DBHelper.status)
        .then(DBHelper.json)
        .then(data => {

        networkDataReceived = true;

            console.log('Request succeeded with JSON response', data);
            //const restaurants = data;
            //console.log('Restaurants: ', restaurants);

        //Add to IndexedDB storage, move to service worker???
        /*
        DBHelper.dbPromise.then( db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');

          data.map(
            restaurant => store.put(restaurant)
          );

        });
        */
        // TODO: either live or cached data
            DBHelper.storeRestaurants(data);
            return data;
        }).catch(err => DBHelper.requestError(err));;
      
    return await DBHelper.dbPromise.then( db => {
      const restaurants = db.transaction('restaurants')
        .objectStore('restaurants');
        
      return restaurants.getAll();

    }).then( restaurants => {
        
      console.log('restaurants from idb:', restaurants);
        
      if(restaurants.length > 0){
          return restaurants;
      }else{
          console.log('restaurants array empty!');
          throw Error("No data");
      }

    }).then( restaurants => {
        
      if (!networkDataReceived) {
          console.log('No Network Data Received!');
          return restaurants;
      }else{
          return networkUpdate;
      }
        
    }).catch(function() {
        console.log('getting there???');
        
      return networkUpdate;
    }).catch(err => DBHelper.requestError(err));
  }
    
static async storeRestaurants(restaurants){
    
    console.log('restaurants to cache: ', restaurants)
    
    //Add to IndexedDB storage
    return await DBHelper.dbPromise.then( db => {
      //if(!db) return;
        console.log(db);
        
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');

      restaurants.map(
        restaurant => store.put(restaurant)
      );
      return restaurants;

    }).catch(err => DBHelper.requestError(err));
}

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return await DBHelper.fetchRestaurants()
    .then(restaurants => {
        const restaurant = restaurants.find(r => r.id == id);
        return restaurant;
    })
    .catch(err => DBHelper.requestError(err));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static async fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants()
    .then( restaurants => {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        
        return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static async fetchNeighborhoods() {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
      console.log(neighborhoods);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
      return  uniqueNeighborhoods;
    }).catch(err => DBHelper.requestError(err));
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static async fetchCuisines() {
    // Fetch all restaurants
    return await DBHelper.fetchRestaurants().then(restaurants => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
      console.log(cuisines);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
      return uniqueCuisines;
    }).catch(err => DBHelper.requestError(err));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
      if(typeof restaurant.photograph != 'undefined'){
          return (`img/${restaurant.photograph}.jpg`);
      }
      else{
           return (`img/${restaurant.id}.jpg`);
      }
  }
    
  /**
   * Restaurant image thumbnail URL.
   */
  static imageThumbUrlForRestaurant(restaurant) {
    var str = this.imageUrlForRestaurant(restaurant);
    var res = str.replace(".jpg", "-thumb.jpg");
    return (res);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
    
/**
 * Add to IndexedDB storage
 */
  static async storeReviews(reviews) {
    //Add to IndexedDB storage
    return await DBHelper.dbPromise.then( db => {

      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');

      reviews.map(
        review => store.put(review)
      );
      console.log('Reviews: ', reviews);
        
      return reviews;
    });
  }
    
    
  /**
   * Fetch all reviews.
   */
  static async fetchReviews() {

    // First try to get cached data from IndexedDB
    // TODO: move to service worker
    return await DBHelper.dbPromise.then( db => {

      const reviews = db.transaction('reviews')
        .objectStore('reviews');
      
        
      return reviews.getAll();

    }).then( reviews => {
        console.log('Reviews', reviews);
        if(reviews.length > 0){
            return reviews.reverse();
        }else{
            fetch(DBHelper.DATABASE_URL+'reviews')
            .then(DBHelper.status)
            .then(DBHelper.json)
            .then(DBHelper.storeReviews)
            .catch(err => DBHelper.requestError(err));
        }
    });
      
    // After that get online data and put in IndexedDB

  }
    

  static async getReviewsByRestaurant(restaurant_id) {
    return await DBHelper.fetchReviews()
    .then( reviews => {
        // Filter restaurants to have only given cuisine type
        const results = reviews.filter(r => r.restaurant_id == restaurant_id);
        return results;
    })
    .catch(err => DBHelper.requestError(err));
  }

  /**
   * Fetch reviews by restaurant id with proper error handling.
   */
  static async fetchReviewsByRestaurant(restaurant_id) {
    
    return await fetch(DBHelper.DATABASE_URL+'reviews/?restaurant_id=' + restaurant_id )
        .then(DBHelper.status)
        .then(DBHelper.json)
        .then(DBHelper.storeReviews)
        .then( reviews => {
            self.restaurant.reviews = reviews;
            return reviews;
        })
        .catch(err => DBHelper.requestError(err));
      
  }
    
  static setFavorite(restaurant_id, is_favorite){

    var url = new URL(DBHelper.DATABASE_URL+`restaurants/${restaurant_id}/`),
    params = {is_favorite:is_favorite};
      console.log(url);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      console.log(url);
      
      return fetch(url,
           {
          method: "PUT"
      })
      .then(DBHelper.status)
      .then(DBHelper.json)
      .then(data => {
          
          console.log(data);
            //Add to IndexedDB storage
            DBHelper.dbPromise.then( db => {

              const tx = db.transaction('restaurants', 'readwrite');
              const store = tx.objectStore('restaurants');
                
              store.get(restaurant_id)
              .then(restaurant => {
                  console.log(restaurant);
                  restaurant.is_favorite = is_favorite;
                  //store.put(restaurant);
              });
                
              store.put(data);

            }).catch(err => DBHelper.requestError(err));
          
          ;
      })
      .catch(err => DBHelper.requestError(err));
  }
    
static storeReview(review){
        // Check for Web Storage support
        
        if (typeof(Storage) !== "undefined") {
            // Add date attribute
            review.createdAt = new Date();
            
            const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
            reviews.push(review);
            
            localStorage.setItem('reviews', JSON.stringify(reviews));
            console.log(review);
        } else {
            // TODO: Display Error
            console.error('Your browser does not support Web Storage!');
        }
}

/**
* Get reviews from localstorage if any
*/
  static async getQueuedReviews(){
      await null;
      const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
      return reviews;
  }
    
static async postReviews(reviews) {
console.log(reviews);
    if(reviews.length > 0){
        reviews.forEach( review => {
            await DBHelper.postReview(review);
        });
    }
    
}
    
    static clearReviews() {
        localStorage.removeItem('reviews');
    }
    
    
  /**
   * Fetch reviews by restaurant id with proper error handling.
   */
  static async postReview(review){
      if(!navigator.onLine){
          // give createdAt attribute
          console.log('not online!');
          return await DBHelper.storeReview(review);
          
        return review;
      }else{
          
          review = JSON.stringify(review);
          
          return await fetch(DBHelper.DATABASE_URL+'reviews',
          {
              method: "POST",
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: review
          }).then(DBHelper.status)
          .then(DBHelper.json)
          .then(data => {
            console.log('Request succeeded with JSON response', data);
              return data;
          }).catch(err => DBHelper.requestError(err));
      }

    }
}

