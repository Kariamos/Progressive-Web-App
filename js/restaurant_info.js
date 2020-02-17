let restaurant;
var map;


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.setAttribute(`aria-label`,`restaurant name: ${restaurant.name}`);
  name.setAttribute("tabindex","0");
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  const mediumImage = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg","-medium.jpg");
  const smallImage = DBHelper.imageUrlForRestaurant(restaurant).replace(".jpg","-small.jpg");
  image.setAttribute("srcset", mediumImage+" 400w,"+DBHelper.imageUrlForRestaurant(restaurant)+" 800w,"+smallImage+" 200w");
  image.setAttribute("alt",`Picture of the restaurant ${restaurant.name}`);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }


  createReviewsForm();

 getAllReviews();
  // fill reviews
  fillReviewsHTML();

 

}



function getAllReviews() {
  console.log("get all reviews");
    const port = 1337 // Change this to your server port
    const url = `http://localhost:${port}/reviews/`;
    fetch(url)
    .then(response =>{
      return response.json();
    })
    .then(data => {
      //console.log(data);
      const dbPromise = idb.open('db-project2', 1);
          dbPromise.then(db =>{
             const tx = db.transaction("reviewsOS", "readwrite");
             const reviewsOS = tx.objectStore("reviewsOS");
             for(var i=0; i<data.length; i++)
             reviewsOS.put(data[i]);
          }).catch( err => {console.log(err)});
    });
}



function createReviewsForm(restaurant = this.restaurant) {


  const form = document.getElementById("form-container");


  const restId = document.createElement("input");
  restId.type = "text";
  restId.value = restaurant.id;
  restId.id="restId";
  restId.name = "restaurant_id";
  restId.style = "display:none;";
  form.appendChild(restId);
  


}






/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('th');
	day.setAttribute(`aria-label`,`Opened day: ${key}`);
	day.setAttribute(`tabindex`,`0`);
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
	time.setAttribute(`aria-label`,`Opening hours: ${operatingHours[key]}`);
	time.setAttribute(`tabindex`,`0`);
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (id = this.restaurant.id) => {
  if(navigator.onLine){
  fetch("http://localhost:1337/reviews/?restaurant_id="+id)
  .then(data => {
    return data.json();
  })
  .then(reviews => {
      const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.style = "font-weight:300;";
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
  });
  }
  else{
    console.log("I'M OFFLINE");
    const dbPromise = idb.open('db-project2', 1, (upgradeDB => {
    if(!upgradeDB.objectStoreNames.contains('reviewsOS'))
      upgradeDB.createObjectStore("reviewsOS", {keyPath: 'id'});

  })
  )
          dbPromise.then(db =>{
             const tx = db.transaction("reviewsOS", "readonly");
             const reviewsOS = tx.objectStore("reviewsOS");
             reviewsOS.getAll()
  .then(reviews => {
      const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.style = "font-weight:300;";
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
    if(review.restaurant_id==id)
    ul.appendChild(createReviewHTML(review));
    else
      return;
  });
  container.appendChild(ul);
  });
             

    })

}
  
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.setAttribute(`aria-label`,`reviewer name: ${review.name}`);
  name.setAttribute("tabindex","0");
  li.appendChild(name);

  const date = document.createElement('p');
  //const dateToShow ="Created at: "+ review.createdAt.getDay() + review.createdAt.getMonth(); + review.createdAt.getYear(); + " " + review.createdAt.getHour(); +':' + review.createdAt.getMinutes();

  date.innerHTML = review.createdAt;
  date.setAttribute(`aria-label`,`review date: ${review.createdAt}`);
  date.setAttribute("tabindex","0");
  li.appendChild(date);

  /*const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);*/
 
 
	const stars = document.createElement('p');
   const starsNumber = parseInt(review.rating);
   stars.innerHTML = '<i style="font-size:12px;">Rating:</i> ';
   if(starsNumber!=0){
   for (var i=0; i<starsNumber; i++){
	   temp = '<i class="fa fa-star-o"></i>';
	stars.innerHTML+=temp;
    }
	stars.setAttribute(`aria-label`,`rating: ${review.rating}`);
	stars.setAttribute("tabindex","0");
	li.appendChild(stars);
   }
  

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.setAttribute(`aria-label`,`review comment: ${review.comments}`);
  comments.setAttribute("tabindex","0");
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
