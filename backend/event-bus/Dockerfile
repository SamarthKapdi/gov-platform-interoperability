FROM node:20-alpine
WORKDIR /app
COPY shared /shared
COPY backend/event-bus/package*.json ./
# Install shared module directly
RUN npm install /shared
RUN npm install
COPY backend/event-bus/ .
EXPOSE 3050
CMD ["node", "server.js"]
