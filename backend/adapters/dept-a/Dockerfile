FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/adapters/dept-a/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/adapters/dept-a/ .
EXPOSE 3011
CMD ["node", "server.js"]
