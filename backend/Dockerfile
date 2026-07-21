# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- Dependencies (cached layer) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---- Runtime ----
FROM base AS runtime
RUN apk add --no-cache dumb-init \
  && addgroup -g 1001 -S nodejs \
  && adduser -S campusconnect -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# uploads/ is only used as a Multer scratch buffer target on some platforms;
# actual files always go to Firebase Storage, never persisted to this layer
RUN mkdir -p uploads && chown -R campusconnect:nodejs /app

USER campusconnect
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "const p = process.env.PORT || 5000; require('http').get('http://localhost:' + p + '/api/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
