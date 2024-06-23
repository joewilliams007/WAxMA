<p align="center"> <img src="https://github.com/joewilliams007/WAxMA/blob/main/waxma.jpg?raw=true" /> </p>

# WAxMA
WAxMA is a bridge between Whatsapp and Matrix groups.

## Features
- [x] messages synced
- [x] files/media synced

### installation
1. install mariadb/msyql-server
2. login to database and paste the script from table.txt into mysql
3. fill out the rest of the config.js

### running
note: you need to run two proccesses.

> npm start (or node -r esm matrix)

aswell as

> node whatsapp.js
(then scan qr code with whatsapp link devices)

### requirements
- mysql-server or mariadb-server installed & set up
- chromium or chrome installed
