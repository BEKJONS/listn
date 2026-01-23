# Railway Deployment Guide

## Steps to Deploy on Railway

1. **Create a Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

4. **Configure Environment Variables**
   - Railway automatically sets:
     - `DATABASE_URL` (from PostgreSQL service)
     - `PORT` (automatically set by Railway)
   - No additional configuration needed!

5. **Deploy**
   - Railway will automatically detect the Dockerfile or nixpacks.toml
   - The build process will:
     1. Build the frontend (React app)
     2. Build the Go server
     3. Start the application

## Important Notes

- **Database Connection**: The app now has retry logic (10 attempts with exponential backoff) to handle Railway's database initialization
- **Port**: Railway sets the `PORT` environment variable automatically - the app will use it
- **Static Files**: The built frontend is included in the Docker image

## Troubleshooting

If you see connection errors:
1. Make sure the PostgreSQL service is running
2. Check that `DATABASE_URL` is set in Railway's environment variables
3. The app will retry connecting automatically (up to 10 times)

## Build Configuration

Railway will use:
- **Dockerfile** (if present) - for Docker-based builds
- **nixpacks.toml** (if Dockerfile not used) - for Nixpacks builds

Both are configured and ready to use!
