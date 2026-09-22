FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/adapters/dept-b/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/adapters/dept-b/ .
EXPOSE 3012
CMD ["node", "server.js"]
