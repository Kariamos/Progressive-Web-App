let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
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
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
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
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
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
  self.markers.forEach(m => m.setMap(null));
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

  const image = document.createElement('img');
  image.setAttribute("tabindex","0");
  image.setAttribute("aria-label","Restaurant image");
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const mediumImage = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg","-medium.jpg");
  const smallImage = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg","-small.jpg");
  image.setAttribute("srcset", mediumImage+" 400w,"+DBHelper.imageUrlForRestaurant(restaurant)+" 800w,"+smallImage+" 200w");
  image.setAttribute("alt",`Image for the restaurant ${restaurant.name}`);
  
  li.append(image);

  const name = document.createElement('h2');
  name.setAttribute("tabindex","0");
  name.setAttribute("aria-label","Restaurant name: "+restaurant.name);
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.setAttribute("tabindex","0");
  neighborhood.setAttribute("aria-label","Restaurant neighborhood: "+restaurant.neighborhood);
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.setAttribute("tabindex","0");
  address.setAttribute("aria-label","Restaurant address: "+restaurant.address);
  address.innerHTML = restaurant.address;
  li.append(address);


  
  //Create a paragraph for like button and dislike button
  var par = document.createElement("p");
  par.setAttribute("style","margin-top: 3%;");

  //create a like button
  var favCheckbox = document.createElement('input');
  favCheckbox.type="checkbox";
  favCheckbox.setAttribute("id",`fav${restaurant.id}`);
  favCheckbox.setAttribute("value",`${restaurant.id}`);
  favCheckbox.setAttribute("class","css-checkbox");
  favCheckbox.setAttribute("onclick",`checkFavorite(this.value); showAlert(this);`);
  if(restaurant.is_favorite==="true"){
    favCheckbox.setAttribute("checked","true");
  }

  par.append(favCheckbox);

  var labelFav = document.createElement("label");
  labelFav.setAttribute("class","css-label");
  labelFav.setAttribute("for",`fav${restaurant.id}`);
  par.append(labelFav);
  li.append(par);




  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
 
}

  
function checkFavorite(id){
  
        fetch(`http://localhost:1337/restaurants/${id}`)
      .then(data => {return data.json();})
      .then(restaurant =>{
        
          //Upgrade IDB value of is_favorite
          const dbPromise = idb.open('db-project2', 1, (upgradeDB => {
          if(!upgradeDB.objectStoreNames.contains('restaurantsOS'))
          upgradeDB.createObjectStore("restaurantsOS", {keyPath: 'id'});

          })
         )
          dbPromise.then(db =>{
             const tx = db.transaction("restaurantsOS", "readwrite");
             const restaurantsOS = tx.objectStore("restaurantsOS");
             restaurantsOS.get(parseInt(id)).
             then(res => {
                if(res.is_favorite === "true"){
                    res.is_favorite=false;
                    restaurantsOS.put(res);
                    fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=false`,{method: 'PUT'});
                    //showAlert(`${res.name} is no more favorite`);

             }
             else if(res.is_favorite==="false"){
              res.is_favorite=true;
              restaurantsOS.put(res);
              fetch(`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=true`,{method: 'PUT'});
              //showAlert(`${res.name} is now favorite`);
             }
             })            
           })
          })

    }


function showAlert(checkbox) {
  var text;
    if(checkbox.checked)
      text= "Added to favorites";
    else
      text = "Removed from favorites";

    var x = document.getElementById("notification");
    x.className = "show";
    x.innerHTML=text;
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 2000);
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
