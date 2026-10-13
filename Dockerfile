# Multi-stage production Dockerfile for NIDPIK
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json bun.lock* ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/public ./public
COPY --from=builder /app/nidpik.sqlite ./nidpik.sqlite

# Install tsx globally in runner for seamless TypeScript execution
RUN npm install -g tsx

EXPOSE 8080

CMD ["tsx", "server.ts"]
