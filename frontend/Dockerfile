# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_API_TOKEN=acme-secret-key-2024
COPY package*.json ./
RUN npm ci
COPY . .
# Pass build args as env vars only during the build step, not as persistent layers
RUN VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_API_KEY=$VITE_API_TOKEN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
