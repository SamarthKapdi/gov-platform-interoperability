FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/consent/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/consent/ .
EXPOSE 3040
CMD ["node", "server.js"]
