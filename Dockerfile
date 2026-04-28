# Multi-stage Dockerfile for Hero's Journey (variant B)

# Build stage: install deps and build frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Frontend image: serve built files with nginx
FROM nginx:stable-alpine AS frontend
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Backend image: server + bot
FROM node:20-alpine AS backend
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY server ./server
COPY bot ./bot
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/index.js"]
