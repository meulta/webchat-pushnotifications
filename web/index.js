(function () {

    var startChat = function () {
        let botConnection;
        let secret = "G5G_lk6gybA.cwA.zko.9IFzFnwolm5nN8MGEz2D2dAK_vOdvjTscQsCIM6n8OU";

        if (getParameterByName("isback") === 'y') {
            botConnection = new DirectLine.DirectLine({
                secret: secret,
                conversationId: localStorage.getItem("pushsample.botConnection.conversationId"),
                webSocket: false
            });
        } else {
            botConnection = new DirectLine.DirectLine({
                secret: secret,
                webSocket: false
            });
        }

        botConnection.connectionStatus$
            .filter(s => s === 2)
            .subscribe(c => {
                BotChat.App({
                    botConnection: botConnection,
                    user: { id: botConnection.conversationId}, //you could define you own userid here
                    resize: 'detect'
                }, document.getElementById("bot"));

                setupPush((subscriptionInfo) => {
                    botConnection
                        .postActivity({
                            type: "event",
                            name: "pushsubscriptionadded",
                            value: subscriptionInfo,
                            from: { id: botConnection.conversationId } //you could define your own userId here
                        })
                        .subscribe(id => {
                            localStorage.setItem("pushsample.botConnection.conversationId", botConnection.conversationId);
                        });
                });
            });

        botConnection.activity$.subscribe(c => {
            //here is were you can get each activity's watermark
            console.log(botConnection.watermark);
        });
    };

    // Push
    var setupPush = function (done) {
        navigator.serviceWorker.register('service-worker.js')
            .then(function (registration) {
                return registration.pushManager.getSubscription()
                    .then(function (subscription) {
                        if (subscription) {
                            return subscription;
                        }

                        const vapidPublicKey = 'BBgtNFYzceV57tycIAZ1D-ypCFRixbue9ont_Imet2nwCp6C3oRO18Zh0VQWxkM7ZTKM5HXcTjqIkBsSNn8o_q0';
                        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

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

    startChat();
})();