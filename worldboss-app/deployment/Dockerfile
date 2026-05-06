FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
