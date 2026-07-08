# Multi-stage production build for Next.js Web Client
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm install
COPY . .
RUN npm run build --workspace=apps/web

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
EXPOSE 8080
CMD ["npm", "run", "start", "--workspace=apps/web"]
