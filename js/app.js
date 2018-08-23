document.addEventListener('DOMContentLoaded', event => {
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').then( registration => {
        console.log('Service worker registration succeeded:', registration);

      }).catch( error => {
        console.log('Service worker registration failed:', error);
      });

    } else {
      console.log('Service workers are not supported.');
    }
/* We're doing this on the page
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then( registration => {
          
        if ('sync' in registration) {
          console.log('Sync supported!');
            
const form = document.getElementById('review-form');
form.addEventListener('submit', event => {
            console.log('submitted form!');
          registration.sync.register('reviews').then( registration => {
            console.log('Sync registered!');
          }).catch(error => {
              console.error('Error: ', error);
          });
    
 }, false);
            
        }
        return registration;
       
          
      }).catch(function() {
        
      });
    } else {
      console.log('Service workers and background sync are not supported.');
    }
*/
    window.addEventListener('online', showOffLine);
    window.addEventListener('offline', showOffLine);
    showOffLine();
});

showOffLine = () => {
  if (!navigator.onLine){
    notify('No connection. Any reviews you submit will be send when back online.');
  }else{
      /*
          DBHelper.getQueuedReviews().then(reviews => {
              console.log('Reviews from IDB: ', reviews);
              DBHelper.postReviews(reviews);
          }).catch(error=> {
            console.error('Error: ', error);
          })
      */
    resetNotification();
      
      
      
  }
}


/*
* Notification
*/
notify = (notification) => {
    const div = document.getElementById('notification');
    div.innerHTML = notification;
    div.style.visibility = "visible";
}
/*
* Notification
*/
resetNotification = () => {
    const div = document.getElementById('notification');
    div.innerHTML = '';
    div.style.visibility = "hidden";
}

toggleFavorite = (restaurant) => {
    var state = restaurant.is_favorite;
    
    //check in case is_favorite contains sting set to bool
    if(state === 'true'){
       state = true;
    }else if(state === 'false'){
        state = false;
    }
    
    DBHelper.setFavorite(restaurant.id, !state)
    .then( () => {
        restaurant.is_favorite = !state;
    });
}