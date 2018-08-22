let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added 
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = function() {
  DBHelper.fetchNeighborhoods().then(neighborhoods => {
    console.log(neighborhoods);
    self.neighborhoods = neighborhoods;
    
  }).then(neighborhoods => {
      fillNeighborhoodsHTML();
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = async function() {
  return await DBHelper.fetchCuisines().then(cuisines => {
    console.log(cuisines);
    self.cuisines = cuisines;
    fillCuisinesHTML();
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
    
    console.log('initMap!');
    
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
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

  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = async () => {
    
    console.log('updateRestaurants called!');
    
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
  .then(restaurants => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
  });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
    
  const imageLink = document.createElement('a');
  imageLink.href = DBHelper.urlForRestaurant(restaurant);
  li.append(imageLink);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageThumbUrlForRestaurant(restaurant);
  image.alt = "An image of " + restaurant.name;
  image.width = '340';
  image.height = '255';
  imageLink.append(image);
    
    const favoriteButton = document.createElement('button');
    favoriteButton.classList.add('add-to-favorites');
    //favoriteButton.addEventListener('click', toggleFavorite, false);
    favoriteButton.setAttribute('aria-label', `Add ${restaurant.name} to favorites`)
    
    if(restaurant.is_favorite == 'true'){
        favoriteButton.classList.add("favorite");
    }
    
    favoriteButton.addEventListener('click', ()=>{
        toggleFavorite(restaurant);
        favoriteButton.classList.toggle("favorite");
    }, false);
    
    const favoriteLabel = document.createElement('span');
    favoriteLabel.classList.add('label');
    favoriteLabel.innerHTML = 'Add to favorites';
    favoriteButton.append(favoriteLabel);
    li.append(favoriteButton);
    
  const name = document.createElement('h1');
  name.tabIndex = 0;
  li.append(name);

  const nameLink = document.createElement('a');
  nameLink.innerHTML = restaurant.name;
  nameLink.href = DBHelper.urlForRestaurant(restaurant);
  name.append(nameLink);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);
    
  const more = document.createElement('a');	
  more.className = 'button';
  more.innerHTML = 'View Details';	
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}

