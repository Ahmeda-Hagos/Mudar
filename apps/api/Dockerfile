# Multi-stage production build for NestJS Backend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm install
COPY . .
RUN npm run build --workspace=apps/api

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
EXPOSE 3000
CMD ["npm", "run", "start:prod", "--workspace=apps/api"]
