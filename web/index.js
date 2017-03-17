
// Push

var setupPush = function (done) {

    var endpoint;
    var key;
    var authSecret;

    navigator.serviceWorker.register('service-worker.js')
        .then(function (registration) {
            return registration.pushManager.getSubscription()
                .then(function (subscription) {
                    if (subscription) {
                        return subscription;
                    }

                    var toto = registration.pushManager.subscribe({
                        userVisibleOnly: true
                    });

                    return toto;

                });
        }).then(function (subscription) {
            var rawKey = subscription.getKey ? subscription.getKey('p256dh') : '';
            key = rawKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey))) : '';
            var rawAuthSecret = subscription.getKey ? subscription.getKey('auth') : '';
            authSecret = rawAuthSecret ? btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuthSecret))) : '';

            endpoint = subscription.endpoint;

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

// Web chat

var botConnection = new BotChat.DirectLine({
    secret: "G5G_lk6gybA.cwA.zko.9IFzFnwolm5nN8MGEz2D2dAK_vOdvjTscQsCIM6n8OU"
});

if (getParameterByName("isback") === 'y') {
    botConnection.expiredToken();
    botConnection.conversationId = localStorage.getItem("pushsample.botConnection.conversationId");
    botConnection.token = localStorage.getItem("pushsample.botConnection.token");;
    botConnection.connectionStatus$.next(2);
    botConnection.streamUrl = localStorage.getItem("pushsample.botConnection.streamUrl")
    botConnection.reconnectToConversation();
}

BotChat.App({
    botConnection: botConnection,
    user: { id: 'meulta' },
    bot: { id: 'botpush2' },
    resize: 'detect'
}, document.getElementById("bot"));

botConnection.connectionStatus$.filter(s => s === 2)
    .subscribe(c => {
        setupPush((subscriptionInfo) => {
            localStorage.setItem("pushsample.botConnection.conversationId", botConnection.conversationId)
            localStorage.setItem("pushsample.botConnection.token", botConnection.token)
            localStorage.setItem("pushsample.botConnection.streamUrl", botConnection.streamUrl)

            botConnection
                .postActivity({
                    type: "event",
                    name: "pushsubscriptionadded",
                    value: subscriptionInfo,
                    from: { id: 'meulta' }
                })
                .subscribe(id => console.log("success"));
        })
    });

