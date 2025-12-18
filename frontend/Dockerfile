FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE=http://backend:8080
ENV VITE_API_BASE=${VITE_API_BASE}

COPY package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
