var baseurl = "https://webchatpush.azurewebsites.net";

self.addEventListener('push', function(event) {
  var payload = event.data ? event.data.text() : 'No message...';
  event.waitUntil(
    self.registration.showNotification('Chat bot!', {
      body: payload,
      icon: '/web/img/thinking_morphi.png'
    })
  );
});

self.addEventListener('notificationclick', function(event) {  
  console.log('On notification click: ', event.notification.tag);  
  // Android doesn't close the notification when you click on it  
  // See: http://crbug.com/463146  
  event.notification.close();

  // This looks to see if the current is already open and  
  // focuses if it is  
  event.waitUntil(
    clients.matchAll({  
      type: "window"  
    })
    .then(function(clientList) {  
      for (var i = 0; i < clientList.length; i++) {  
        var client = clientList[i];  
        if ((client.url.toLowerCase() == baseurl +'/web/index.html' || client.url.toLowerCase() == baseurl + '/web/index.html?isback=y') && 'focus' in client)  
          return client.focus();  
      }  
      if (clients.openWindow) {
        return clients.openWindow('/web/index.html?isback=y');  
      }
    })
  );
});