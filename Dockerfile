FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_FILE=/app/data/db.json

EXPOSE 3000

CMD ["node", "server.js"]