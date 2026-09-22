FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/workflow/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/workflow/ .
EXPOSE 3060
CMD ["node", "server.js"]
