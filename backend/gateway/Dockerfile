FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/gateway/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/gateway/ .
EXPOSE 3000
CMD ["node", "server.js"]
