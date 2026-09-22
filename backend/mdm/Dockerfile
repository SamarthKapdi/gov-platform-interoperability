FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/mdm/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/mdm/ .
EXPOSE 3030
CMD ["node", "server.js"]
