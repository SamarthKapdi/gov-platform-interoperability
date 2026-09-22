FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/adapters/dept-c/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/adapters/dept-c/ .
EXPOSE 3013
CMD ["node", "server.js"]
