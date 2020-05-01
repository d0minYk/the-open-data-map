pm2 stop server
ENV=PROD pm2 start server.js -- --production
