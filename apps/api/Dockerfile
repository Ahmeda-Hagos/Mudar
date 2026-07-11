FROM node:22-slim

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json ./

# Copy all workspaces
COPY apps ./apps
COPY packages ./packages

# Install all dependencies
RUN npm ci

# Generate Prisma Client
RUN npm run prisma:generate --workspace=apps/api

# Build the API
RUN npm run build:api

# Expose API port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod", "--workspace=apps/api"]
