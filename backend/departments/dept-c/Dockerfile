FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/departments/dept-c/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/departments/dept-c/ .
EXPOSE 3003
CMD ["node", "server.js"]
