FROM node:20 AS frontend-build
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app

COPY api/package*.json ./
RUN npm install --omit=dev

COPY api/ ./

COPY --from=frontend-build /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "app.js"]