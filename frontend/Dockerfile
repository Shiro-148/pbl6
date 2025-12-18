# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time API base for the frontend (used by Vite)
ARG VITE_API_BASE=http://backend:8080
ENV VITE_API_BASE=${VITE_API_BASE}

# Install dependencies (supports optional lock file)
COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ---- Run stage (Nginx) ----
FROM nginx:alpine

# Add a basic SPA nginx config with history fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
