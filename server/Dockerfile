FROM node:22-slim AS build

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY server/prisma ./prisma
RUN npm run db:generate

COPY server/tsconfig.json ./
COPY server/src ./src
COPY packages/shared/src/rules /app/packages/shared/src/rules
COPY packages/shared/package.json /app/packages/shared/package.json
RUN npm run build

FROM node:22-slim AS runtime

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY server/prisma ./prisma
RUN npm run db:generate

COPY --from=build /app/server/dist ./dist
COPY --from=build /app/packages /app/packages

USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/ready').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

CMD ["node", "--import", "./dist/instrument.js", "dist/index.js"]
