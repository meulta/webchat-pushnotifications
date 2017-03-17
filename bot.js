var webPush = require('web-push');
var restify = require('restify');
var builder = require('botbuilder');

webPush.setGCMAPIKey(process.env.GCM_API_KEY);

var server = restify.createServer();
server.use(restify.bodyParser());

server.listen(process.env.port || process.env.PORT || 3000, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var pushPerUser = [];

bot.on("outgoing", function (message) {
    if (pushPerUser && pushPerUser[message.address.user.id]) {
        var pushsub = pushPerUser[message.address.user.id];

        webPush.sendNotification({
            endpoint: pushsub.endpoint,
            TTL: "1",
            keys: {
                p256dh: pushsub.key,
                auth: pushsub.authSecret
            }
        }, message.text);
    }
});

bot.on("event", function (message) {
    if (message.name === "pushsubscriptionadded") {
        pushPerUser[message.user.id] = message.value;
    }
});

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
       message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                    .address(message.address)
                    .text("Howdy! I am a [demo bot](https://github.com/meulta/ServiceWorkersSamples) using the [WebChat control](https://github.com/Microsoft/BotFramework-WebChat) and with Push Notifications! Say **hello** and I will send a message every 10 seconds. If you accepted notifications, you will get one! If you close the tab but leave the browser opened, you will get a notification when I talk. Oh and say **stop** to shut me off :)");
                bot.send(reply);
            }
        });
    }
});

var loop = false;
bot.dialog('/', function (session) {
    if (session.message.text === "stop") {
        session.send("Stopping loop");
        loop = false;
    }
    else {
        loop = true;
        proactiveEmulation(session);
    }
});

var proactiveEmulation = (session) => {
    if (loop) {
        session.send("Hello World of web push! :)");
        setTimeout(() => proactiveEmulation(session), 10000);
    }
};

server.get(/\/web\/?.*/, restify.serveStatic({
    directory: __dirname
}));

server.post('/register', function (req, res) {
    res.send(201);
});