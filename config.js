/*

How to use?

replace the ***** to configure.

installation:
1. install mariadb/msyql-server
2. login to database and paste the script from table.txt into mysql
3. fill out the rest of the config.js

running:
note: you need to run two proccesses.
1. npm start (or node -r esm matrix)
2. node whatsapp.js (then scan qr code with whatsapp link devices)

*/

var config = {
    whatsappGroupId: "*****@g.us", // id of the whatsapp group to be synced (find out by adding console.log(msg) in client.on('message' ... ) in whatsapp.js)
    matrixGroupId: "*****:matrix.org", // id can be found out in element web under room settings

    matrixHomeServer: "https://matrix.org", // default home server
    matrixUsername: "@*****:matrix.org", // username for matrix
    matrixPassword: "*****", // password for matrix

    chromiumInstallationPath: "/usr/bin/chromium-browser",

    databaseHost: "127.0.0.1", // localhost
    databaseUser: "*****", // username for mysql
    databasePassword: "*****", // password for mysql
    databaseName: "db_bridge",
}

module.exports = { config };