FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/audit/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/audit/ .
EXPOSE 3070
CMD ["node", "server.js"]
