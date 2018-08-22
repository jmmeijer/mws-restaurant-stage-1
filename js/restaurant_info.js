let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL()
    .then( restaurant => {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoibXJmZWVsZ29vZCIsImEiOiJjams1aGh6OGUxampqM29yeWU2djh2YWpyIn0.qxPk11pu0nXl21HLOn_DFQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
  });
}

initForm = (restaurant = self.restaurant) => {

    const form = document.getElementById('review-form');
    document.getElementById('restaurant_id').value = restaurant.id;
    
    form.addEventListener('submit', event => {
        
        // Don't submit just yet
        event.preventDefault();
        
        const review = {};
        // Get form data
        const data = new FormData(form);
        data.forEach(function(value, key){
            review[key] = value;
        });
        //const json = JSON.stringify(review);
        
        // Disable form via fieldset while handling form data async
        const fieldset = form.querySelector('fieldset');
        fieldset.disabled = true;
        
        console.log(data);
        //console.log(json);
        
        submitReview(review).then(() => {
            console.log('form submitted');
        });
        
    }, false);
}

initFavorite = (restaurant = self.restaurant) => {

    const favorite = document.getElementById('add-to-favorites');
    
    console.log('is_favorite?', restaurant.is_favorite);
    
    if(restaurant.is_favorite === true || restaurant.is_favorite === 'true'){
        console.log('not favorite');
        favorite.classList.toggle("favorite");
    }
    
    favorite.addEventListener('click', ()=>{
        toggleFavorite(restaurant);
        favorite.classList.toggle("favorite");
    }, false);
}



/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = async () => {
  if (self.restaurant) {
    console('restaurant already fetched!');
    return self.restaurant;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    console.error(error);
    return error;
  } else {
    return await DBHelper.fetchRestaurantById(id)
    .then( restaurant => {
    
      self.restaurant = restaurant;
        
      if (!restaurant) {
        //console.error(error);
        return;
      }
        return restaurant;
    })
    .then(restaurant => {
        
        console.log('now filling restaurant!');
        
        fillRestaurantHTML();
        return restaurant;
    })
    .catch(err => DBHelper.requestError(err));
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    
console.log('called fillRestaurantHTML!');
    
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = "An image of " + restaurant.name;
  image.width = '800';
  image.height = '600';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
    //TODO: just for now, improve this later!
    DBHelper.fetchReviewsByRestaurant(restaurant.id)
    .then(reviews => {
        self.restaurant.reviews = reviews.reverse();
        resetReviewsHTML();
        fillReviewsHTML();
    })
    .catch(err => DBHelper.requestError(err));

    //fillReviewsHTML();
  // fill reviews
  //fillReviewsHTML();
  initFavorite();
  initForm();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('th');
    day.scope = 'row';
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

resetReviewsHTML = () => {
  const ul = document.getElementById('reviews-list');
  let length = ul.getElementsByTagName("li").length;
    
  for (i = 0; i < length; i++) {
    ul.removeChild(ul.children[0]);
  }
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = getDateFromTimestamp(review.createdAt);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/** 
 * Get Date from Timestamp: October 26, 2016
 */
getDateFromTimestamp = (timestamp) => {
  datetime = new Date(timestamp);
    
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const year = datetime.getFullYear();
  const month = months[datetime.getMonth()];
  const date = datetime.getDate();
    
  return `${month} ${date}, ${year}`;
}

submitReview = async (review) => {
  return await DBHelper.storeReview(review).then(() => {
    // Wait for the scoped service worker registration to get a
    // service worker with an active state
    return navigator.serviceWorker.ready;
  }).then(registration => {
    return registration.sync.register('reviews');
  }).then(() => {
    console.log('Sync registered!');
  }).catch(() => {
    console.log('Sync registration failed :(');
  }).then( review => {    
    const ul = document.getElementById('reviews-list');
      let html = createReviewHTML(review);
      ul.insertAdjacentElement('afterbegin', html);
  });
}