const db = require('./db');

/**
 * Insert message into database.
 * @param {*} pushname 
 * @param {*} message 
 * @param {*} type 
 * @param {*} hasMedia 
 * @param {*} filename 
 * @param {*} mimeType 
 * @param {*} token 
 * @param {*} timestamp 
 * @param {*} source 
 * @param {*} deviceType 
 * @param {*} hasQuotedMsg 
 * @param {*} quotedMsg 
 * @param {*} quotedMsgPushname 
 * @param {*} isGif 
 * @param {*} isForwarded 
 */
function insertMessage(pushname, message, type, hasMedia, filename, mimeType, token, timestamp, source, deviceType, hasQuotedMsg, quotedMsg, quotedMsgPushname, isGif, isForwarded) {
    db.query( // register userstuff
        `INSERT INTO Messages (pushname, message, type, hasMedia, filename, mimeType, token, timestamp, source, deviceType, hasQuotedMsg, quotedMsg, quotedMsgPushname, isGif, isForwarded) 
        VALUES ("${pushname}", "${message}", "${type}", ${hasMedia}, "${filename}", "${mimeType}", "${token}", ${timestamp}, "${source}", "${deviceType}", ${hasQuotedMsg}, "${quotedMsg}", "${quotedMsgPushname}", ${isGif}, ${isForwarded})`
        , function (error, results, fields) {
            if (error) return console.log("\nError inserting message "+error)
    });
}

module.exports = {insertMessage};