const { Client, LocalAuth, Location, List, Buttons, MessageMedia, NoAuth, MediaFromURLOptions } = require('whatsapp-web.js');
const fs = require("fs");
const qrcode = require('qrcode-terminal');
const dbhelper = require('./dbhelper');
const db = require('./db');
const folder = './media/';
const config = require("./config").config;

/**
 * Create a client, provide chromium.
 */
const client = new Client({
    puppeteer: { executablePath: config.chromiumInstallationPath, headless: true, args: ['--no-sandbox'], },
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    // authStrategy: new LocalAuth({ clientId: id })
});

/**
 * Generate QR-Code to link with Whatsapp.
 */
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
    listenDatabase();
});

/**
 * Listen to new messages from database.
 */
function listenDatabase() {
    setInterval(() => {
        db.query('SELECT * FROM Messages WHERE source = "matrix" AND synced = 0', (error, results) => {
            if (error) throw error;
            results.forEach(row => {

                console.log("sauce: " + row.source)
                sendMessage(row)

                db.query('UPDATE Messages SET synced = 1 WHERE message_id = ?', [row.message_id], err => {
                    if (err) throw err;
                });
            });
        });
    }, 1000);
}

/**
 * Send a message to Whatsapp.
 * @param {database message} msg 
 */
async function sendMessage(msg) {
    const prefix = "["+msg.pushname.split(":")[0].replace("@","")+"] ";
    if (msg.type != "m.image") {
        client.sendMessage(config.whatsappGroupId, prefix+msg.message);
    }

    const reqOptions = {
        headers: {
            'Authorization': `Bearer ${msg.token}`
        }
    };

    const options = {
        reqOptions: reqOptions,
        unsafeMime: true
    };

    try {
        const mediaLink = await MessageMedia.fromUrl(msg.filename, options);
        client.sendMessage(config.whatsappGroupId, mediaLink, { caption: prefix+msg.message }).then(function (res) { }).catch(function (err) { });
    } catch (error) {
        console.error('Error fetching media:', error);
    }
}

/**
 * Listen to messages and insert into database.
 */
client.on('message', msg => {
    const data = msg._data;

    if (msg.body == '!ping') {
        msg.reply('pong');
    }

    if (msg.from != config.whatsappGroupId) return;
    if (data.type == "poll_creation") {
        var text = "[a poll has started] " + msg.body
        dbhelper.insertMessage(data.notifyName, text, data.type, msg.hasMedia, null, null, null, msg.timestamp, "whatsapp", msg.deviceType, msg.hasQuotedMsg, null, null, msg.isGif, msg.isForwarded)
        return;
    }
    if (!msg.hasMedia) {
        dbhelper.insertMessage(data.notifyName, data.body, data.type, msg.hasMedia, null, null, null, msg.timestamp, "whatsapp", msg.deviceType, msg.hasQuotedMsg, null, null, msg.isGif, msg.isForwarded)
        return;
    } else {
        storeMedia(msg, data)
    }
});

/**
 * Store the media of a Whatsapp message.
 */
async function storeMedia(msg, data) {
    const media = await msg.downloadMedia();
    const filename = msg.timestamp + '.' + media.mimetype.split('/')[1];
    const filePath = folder + filename

    var body = msg.body;
    if (body == undefined) {
        body = "";
    }

    fs.writeFile(
        filePath,
        media.data,
        "base64",
        function (err) {
            if (err) {
                console.log(err);
            } else {
                dbhelper.insertMessage(data.notifyName, body, data.type, msg.hasMedia, filename, media.mimetype, null, msg.timestamp, "whatsapp", msg.deviceType, msg.hasQuotedMsg, null, null, msg.isGif, msg.isForwarded)
            }
        }
    );
}

client.initialize();

/**
 * Stops crashing when an error occurs.
 */
process.on('uncaughtException', err => {
    console.error(err && err.stack)
});