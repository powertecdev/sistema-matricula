FROM node:18-alpine

RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev jpeg-dev giflib-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npx prisma generate --no-engine || ./node_modules/.bin/prisma generate

EXPOSE 3333

CMD ./node_modules/.bin/prisma db push && npx tsx src/server.ts