FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Generate Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# Build
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Production stage
FROM node:22-slim AS production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/dist ./dist
COPY prisma ./prisma

EXPOSE 3001
CMD ["node", "dist/index.js"]
