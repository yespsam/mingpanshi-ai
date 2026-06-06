FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js mystic-systems.js fortune.py ./
COPY public ./public

RUN mkdir -p /app/.data

EXPOSE 8787

CMD ["node", "server.js"]
