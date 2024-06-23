import sdk from 'matrix-js-sdk';
const fs = require("fs");
const db = require('./db');
const dbhelper = require('./dbhelper');
const config = require("./config").config;

const client = sdk.createClient({
    baseUrl: config.matrixHomeServer,
});

/**
 * Login to Matrix.
 */
client.login("m.login.password", {
    user: config.matrixUsername,
    password: config.matrixPassword
}).then((response) => {
    console.log("Logged in successfully:", response);

    // After logging in, set the access token for the client
    client.setAccessToken(response.access_token);

    console.log(client.access_token)
    startInteractingWithMatrix();
}).catch((error) => {
    console.error("Login failed:", error);
});

/**
 * Start client.
 */
function startInteractingWithMatrix() {
    client.startClient();

    client.once('sync', function (state, prevState, res) {
        if (state === 'PREPARED') {
            console.log('Client is ready and synced!');
            joinRoomAndListenForMessages();
        }
    });
}

/**
 * Join room and listen for messages.
 */
function joinRoomAndListenForMessages() {
    client.joinRoom(config.matrixGroupId).then((room) => {
        console.log("Joined room:", room.roomId);

        client.on(sdk.RoomEvent.Timeline, function (event, room, toStartOfTimeline) {
            if (event.getType() !== "m.room.message") {
                return;
            }
            // console.log(event.event.content.body);
            var event = event.event;
            var content = event.content;
            if (event.sender == config.matrixUsername) return;

            if (content.msgtype == "m.image" || content.msgtype == "m.file" || content.msgtype == "m.audio") {
                saveMessageMedia(event);
            } else {
                dbhelper.insertMessage(event.sender, content.body, content.msgtype, false, null, null, null, 0, "matrix", null, false, null, null, false, false)
            }
        });

        listenDatabase();
    }).catch((error) => {
        console.error("Failed to join room:", error);
    });
}

/**
 * Store a message with media.
 */
function saveMessageMedia(event) {
    const content = event.content;
    const downloadUrl = client.mxcUrlToHttp(
            /*mxcUrl=*/ content.url, // the MXC URI to download/thumbnail, typically from an event or profile
            /*width=*/ undefined, // part of the thumbnail API. Use as required.
            /*height=*/ undefined, // part of the thumbnail API. Use as required.
            /*resizeMethod=*/ undefined, // part of the thumbnail API. Use as required.
            /*allowDirectLinks=*/ true, // should generally be left `false`.
            /*allowRedirects=*/ true, // implied supported with authentication
            /*useAuthentication=*/ false, // the flag we're after in this example
    );

    console.log("SOURCEEE "+downloadUrl)
    dbhelper.insertMessage(event.sender, content.body, content.msgtype, true, downloadUrl, null, client.getAccessToken(), 0, "matrix", null, false, null, null, false, false)
}


/**
 * Listen to messages from database.
 */
function listenDatabase() {
    setInterval(() => {
        db.query('SELECT * FROM Messages WHERE synced = 0 AND source = "whatsapp"', (error, results) => {
            if (error) throw error;
            results.forEach(row => {

                row.message = "["+row.pushname+"] "+row.message;

                if (row.hasMedia) {
                    sendImage(row)
                } else {
                    sendMessage(row.message)
                }

                db.query('UPDATE Messages SET synced = 1 WHERE message_id = ?', [row.message_id], err => {
                    if (err) throw err;
                });
            });
        });
    }, 1000);
}

/**
 * Send a message.
 * @param {*} message 
 */
function sendMessage(message) {
    const content = {
        body: message,
        msgtype: "m.text",
    };
    client.sendEvent(config.matrixGroupId, "m.room.message", content, "", (err, res) => {
        console.log(err);
    });
}

/**
 * Send image to Matrix group.
 */
function sendImage(msg) {
    const file = "./media/" + msg.filename;
    const buffer = fs.readFileSync(file);

    client.uploadContent(buffer, {
        name: msg.mediaPath,
        type: msg.mimeType
    }).then((response) => {
        const contentUri = response.content_uri;

        var content;
        if (msg.mimeType.split("/")[0] == "image") { // Image
            content = {
                msgtype: "m.image",
                body: "image.jpg",
                url: contentUri,
                info: {
                    mimetype: msg.mimeType,
                    size: buffer.length
                }
            };
        } else { // Any other file
            content = {
                msgtype: "m.file",
                body: msg.mimeType,
                url: contentUri,
                info: {
                    mimetype: msg.mimeType,
                    size: buffer.length
                }
            };
        }
        return client.sendEvent(config.matrixGroupId, "m.room.message", content, "");
    }).then((res) => {
        console.log("Image sent successfully:", res);

        sendMessage(msg.message)

        fs.unlink(file, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return;
            }
            console.log('File deleted successfully');
        });

    }).catch((err) => {
        console.error("Error uploading or sending image:", err);
    });
}

/**
 * Stops crashing when an error occurs.
 */
process.on('uncaughtException', err => {
    console.error(err && err.stack)
});