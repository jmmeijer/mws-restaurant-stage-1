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
    
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then( registration => {
          
        if ('sync' in registration) {
          console.log('Sync supported!');
        }
          
        return reg.sync.register('tag-name');
          
      }).catch(function() {
        
      });
    } else {
      
    }
    
    window.addEventListener('online', showOffLine);
    window.addEventListener('offline', showOffLine); 
});

showOffLine = () => {
  if (!navigator.onLine){
    notify('No connection. Any reviews you submit will be send when back online.');
  }else{
    resetNotification();
  }
}


/*
* Notification
*/
notify = (notification) => {
    const div = document.getElementById('notification');
    div.innerHTML = notification;
}
/*
* Notification
*/
resetNotification = () => {
    const div = document.getElementById('notification');
    div.innerHTML = '';
}