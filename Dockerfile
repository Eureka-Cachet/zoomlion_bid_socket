FROM                    node:latest

MAINTAINER              eurekacachetdev@gmail.com

ENV                     NODE_ENV=production

COPY                    socket /var/www/socket

RUN                     npm install supervisor -g

WORKDIR                 /var/www/socket

RUN                     npm install

EXPOSE                  6001

ENTRYPOINT              ["supervisor", "socket.js"]