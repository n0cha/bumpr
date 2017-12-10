Use pm2 commands as user bumpr:

* Start service: pm2 start bumpr-api.config.js
* Show running processes: pm2 list
* Show console output: pm2 log 
* Stop service: pm2 stop bumpr-api
* Save current settings for reboots: pm2 save

Current config uses watch mode, pulling code into /var/sites/bumpr/server reloads the server