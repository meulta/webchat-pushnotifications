(function () {

    const DIRECTLINE_SECRET = ""; //you get that from the direct line channel at dev.botframework.com
    const VAPID_PUBLICKEY = ""; //you get that from the server, which will generate a vapidKey.json file

    var startChat = function () {
        let botConnection;

        if (getParameterByName("isback") === 'y') {

            //if we are resuming an existing conversation, we get back the conversationid from LocalStorage
            botConnection = new DirectLine.DirectLine({
                secret: DIRECTLINE_SECRET,
                conversationId: localStorage.getItem("pushsample.botConnection.conversationId"),
                webSocket: false
            });
        } else {

            //if it is a brand new conversation, we create a fresh one
            botConnection = new DirectLine.DirectLine({
                secret: DIRECTLINE_SECRET,
                webSocket: false
            });
        }

        botConnection.connectionStatus$
            .filter(s => s === 2) //when the status is 'connected' (2)
            .subscribe(c => {

                //everything is setup in DirectLine, we can create the Chatbot control
                BotChat.App({
                    botConnection: botConnection,
                    user: { id: botConnection.conversationId}, //you could define you own userid here
                    resize: 'detect'
                }, document.getElementById("bot"));

                //we setup push notifications (including service worker registration)
                setupPush((subscriptionInfo) => {

                    //once push notifications are setup, we get the subscription info back in this callback
                    //we use the backchannel to send this info back to the bot using an 'event' activity
                    botConnection
                        .postActivity({
                            type: "event",
                            name: "pushsubscriptionadded",
                            value: subscriptionInfo,
                            from: { id: botConnection.conversationId } //you could define your own userId here
                        })
                        .subscribe(id => {

                            //we store the conversation id which we get back from postActivity(...) in the LocalStorage
                            //we will need this in case of conversation resuming
                            localStorage.setItem("pushsample.botConnection.conversationId", botConnection.conversationId);
                        });
                });
            });

        botConnection.activity$.subscribe(c => {

            //here is were you can get each activity's watermark
            //we do not do anything in this sample, but you can use it if you need
            //to restore history at resuming at a specific moment in the conversation
            console.log(botConnection.watermark);
        });
    };

    // Push
    var setupPush = function (done) {

        //first step is registering the service worker file
        navigator.serviceWorker.register('service-worker.js')
            .then(function (registration) {

                //once the sw is registered, we try to get an existing push subscription 
                return registration.pushManager.getSubscription()
                    .then(function (subscription) {

                        //if the subscription exists, then we pass is to the next chained .then function using return
                        if (subscription) {
                            return subscription;
                        }

                        //if the subscription does not exists, we wrap the VAPID public key and create a new one
                        //we pass this new once to the next chaind .then function using return
                        const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLICKEY);
                        return registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey
                        });
                    });
            })
            .then(function (subscription) {

                //wrapping the key and secret
                const rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
                const key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
                const rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
                const authSecret = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

                const endpoint = subscription.endpoint;

                //we call back the code that asked to register push notification with the subscription information
                done({
                    endpoint: subscription.endpoint,
                    key: key,
                    authSecret: authSecret
                });
            });
    }

    // Helpers 
    function getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    //everything is defined, let's start the chat
    startChat();
})();