'use strict';



/**
 * Common database helper functions.
 */
class DBHelper {
    
    static get dbPromise() {
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


  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants/`;
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
   */
  static fetchRestaurants(callback) {

    // First try to get cached data from IndexedDB
    DBHelper.dbPromise.then( db => {
      if(!db) { 
        return;
        console.log('No DB found!');
      }else{
        console.log('DB found!');
      }

      const restaurants = db.transaction('restaurants')
        .objectStore('restaurants');
      
      return restaurants.getAll();

    }).then( restaurants => {
        if(restaurants.length > 0){
            callback(null, restaurants);
        }
    });
      
    // After that get online data and put in IndexedDB
    return fetch(DBHelper.DATABASE_URL)
        .then(DBHelper.status)
        .then(DBHelper.json)
        .then(data => {
            console.log('Request succeeded with JSON response', data);
            const restaurants = data;
            console.log('Restaurants: ', restaurants);

        //Add to IndexedDB storage
        DBHelper.dbPromise.then( db => {
          if(!db) { 
            return;
            console.log('No DB found!');
          }else{
            console.log('DB found!');
          }
            
          const tx = db.transaction('restaurants', 'readwrite');
          const store = tx.objectStore('restaurants');
            
          data.map(
            restaurant => store.put(restaurant)
          );
            
        });
        
        // Temporarily use callback for backwards compatibility, needs complete refactoring
            callback(null, restaurants);
        })
        .catch(err => DBHelper.requestError(err));
  }
    


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
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
          return (`/img/${restaurant.photograph}.jpg`);
      }
      else{
           return (`http://via.placeholder.com/800x600`);
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

}

