FROM node:20-alpine as build
WORKDIR /app
COPY frontend/citizen/package*.json ./
RUN npm install
COPY frontend/citizen/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
