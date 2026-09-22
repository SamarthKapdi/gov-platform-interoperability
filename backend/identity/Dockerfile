FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/identity/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/identity/ .
EXPOSE 3020
CMD ["node", "server.js"]
