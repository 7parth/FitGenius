# Development frontend image — Vite dev server with HMR
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source (overridden by volume mount in dev)
COPY . .

EXPOSE 5173

# Vite needs --host to be reachable from the host machine
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
