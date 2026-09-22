FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/departments/dept-b/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/departments/dept-b/ .
EXPOSE 3002
CMD ["node", "server.js"]
