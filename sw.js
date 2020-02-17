/*Code got from https://developers.google.com/web/tools/workbox/guides/get-started and adapted to my case */


importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js');

/*if (workbox) {
  console.log(`Yay! Workbox is loaded`);
} else {
  console.log(`Boo! Workbox didn't load `);
}*/


workbox.precaching.precacheAndRoute([
  {url: '/index.html', revision: '1a'},
  {url: '/restaurant.html?id=1', revision: "12a"},
  {url: '/restaurant.html?id=2', revision: '123'},
  {url: '/restaurant.html?id=3', revision: '1234'},
  {url: '/restaurant.html?id=4', revision: '12345'},
  {url: '/restaurant.html?id=5', revision: '123456'},
  {url: '/restaurant.html?id=6', revision: '123456a'},
  {url: '/restaurant.html?id=7', revision: '123456ab'},
  {url: '/restaurant.html?id=8', revision: '123456abc'},
  {url: '/restaurant.html?id=9', revision: '123456abcd'},
  {url: '/restaurant.html?id=10', revision: '123456abcde'},
  ]);



workbox.core.setLogLevel(workbox.core.LOG_LEVELS.error);



workbox.routing.registerRoute(
  new RegExp('.*\.js'),
  workbox.strategies.networkFirst({
    cacheName: 'js-cache'
  })
);


workbox.routing.registerRoute(
  // Cache CSS files
  /.*\.css/,
  // Use cache but update in the background ASAP
  workbox.strategies.staleWhileRevalidate({
    // Use a custom cache name
    cacheName: 'css-cache'
  })
);

workbox.routing.registerRoute(
  // Cache image files
  /.*\.(?:png|jpg|jpeg|svg|gif)/,
  // Use the cache if it's available
  workbox.strategies.cacheFirst({
    // Use a custom cache name
    cacheName: 'image-cache',
    plugins: [
      new workbox.expiration.Plugin({
        // Only cache requests for a month
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ]
  })
);




//bg sync
const showNotification = () => {
  self.registration.showNotification('Background sync success!', {
    body: 'Hooorray!'
  });
};



const bgSyncPlugin = new workbox.backgroundSync.Plugin(
  'fail-queue',
  {
    callbacks: {
      queueDidReplay: showNotification
    }
  }
);

const networkWithBackgroundSync = new workbox.strategies.NetworkOnly({
  plugins: [bgSyncPlugin]
});

/*const addEventRoute = new workbox.routing.Route(
  ({url}) => url.pathname === 'http://localhost:1337/reviews/',
  networkWithBackgroundSync,
  'POST'
);

const addEventRoute2 = new workbox.routing.Route(
  ({url}) => url.pathname === 'http://localhost:1337/restaurants/',
  networkWithBackgroundSync,
  'POST'
);*/

workbox.routing.registerRoute(/\/*/, networkWithBackgroundSync, "POST");
workbox.routing.registerRoute(/\/*/, networkWithBackgroundSync, "PUT");

//workbox.routing.registerRoute(addEventRoute);










/* NOT USED

var cacheName = 'project1-v1';
var allCaches = [
  cacheName
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll([
        'js/dbhelper.js',
        'js/main.js',
        'css/styles.css',
        'imgs/icon.png',
        'index.html',
        'restaurant.html',
		'js/restaurant_info.js',
		'data/restaurants.json'
      ]);
    })
  );
  console.log("cached");
});

*/