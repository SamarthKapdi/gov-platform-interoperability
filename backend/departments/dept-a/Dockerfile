FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/departments/dept-a/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/departments/dept-a/ .
EXPOSE 3001
CMD ["node", "server.js"]
