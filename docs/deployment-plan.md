# Deployment Plan (Supabase + Vercel + Render)

This blueprint outlines the exact steps to build and launch VisaFlow AI to production.

## Step 1: Create and Configure GitHub Repository
1. Create a private GitHub repository: `visaflow-ai`.
2. Commit the clean monorepo code (respecting root `.gitignore`).
3. Set up two protected branches: `main` (Production) and `develop` (Staging).

## Step 2: Provision Database and Storage (Supabase)
1. Register a Supabase Organization.
2. Spin up a new PostgreSQL database instance: `visaflow-production`.
3. In the Supabase dashboard, navigate to **Storage**:
   - Create a private bucket called `visaflow`.
   - Setup folder hierarchies structure under policies.

## Step 3: Run Database Migrations
1. Add the Database connection string (`DATABASE_URL`) from Supabase Settings to `.env`.
2. Run database structure generation commands:
   ```bash
   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
   ```
3. Initialize the database seed script:
   ```bash
   npm run prisma:seed --workspace=apps/api
   ```

## Step 4: Deploy NestJS API (Render or Railway)
1. Connect your GitHub repository to Render/Railway.
2. Select root directory `/apps/api`.
3. Map environment variables matching `.env.example`.
4. Configure health check monitoring path: `https://api.visaflow.ai/api/v1/auth/me` (returning 401 is success).

## Step 5: Deploy Next.js Frontend (Vercel)
1. Add a new project in Vercel from the GitHub repository.
2. Select root directory `/apps/web`.
3. Map frontend environment variables:
   - `NEXT_PUBLIC_API_URL`: Points to your deployed API url.
4. Trigger the deployment.
