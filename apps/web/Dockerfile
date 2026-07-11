FROM node:22-slim

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json package-lock.json ./

# Copy all workspaces
COPY apps ./apps
COPY packages ./packages

# Install all dependencies
RUN npm ci

# Build the Web Client
RUN npm run build:web

# Expose Web port
EXPOSE 3000
ENV PORT=3000

# Start the application
CMD ["npm", "run", "start", "--workspace=apps/web"]
