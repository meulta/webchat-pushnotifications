# Webchat with Push notifications

This is a sample of code which shows how you can enable push notifications on a web chat connected to the Microsoft Bot Framework. It is using service workers and Progressive Web Apps features.

# How to try the sample
- clone this repository
- run ```npm install``` from command line
- run it with ```node bot.js```. It will generate the vapidKey.json file
- copy the public key in the vapidKey.json and paste it in the ```VAPID_PUBLICKEY``` constant
- create a public https instance of the bot by
    - deploying it online
    - making is publicly available from your computer using a tool like [ngrok](https://ngrok.com/)
    - modify the ```baseurl``` variable in the service-worker.js file with your public base url (https://something.xyz)
- create a bot at [http://dev.botframework.com](http://dev.botframework.com) using this public endpoint
- activate the direct line channel on your bot and copy the key it gives you in the ```DIRECTLINE_SECRET``` constant in the index.js file
- redeploy if needed

You can now browse https://something.xyz/web/index.html and talk to the bot ! :)