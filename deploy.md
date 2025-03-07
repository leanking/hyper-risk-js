# Deployment Guide for Hyper Risk

This guide provides step-by-step instructions for deploying the Hyper Risk application to Render.com.

## Prerequisites

Before you begin, make sure you have:

1. A [Render.com](https://render.com) account
2. A [Supabase](https://supabase.com) account with a project set up
3. Your Supabase URL and API key
4. Git installed on your local machine

## Deployment Steps

### 1. Prepare Your Repository

Ensure your repository includes all the necessary files for deployment:

- `package.json` - Main project dependencies
- `src/frontend/package.json` - Frontend dependencies
- `Procfile` - Specifies the command to run the application
- `render-build.sh` - Build script for Render
- `render.yaml` - Render configuration file
- `.npmrc` - NPM configuration file

### 2. Set Up Supabase

1. Log in to your Supabase account
2. Create a new project or use an existing one
3. Navigate to Project Settings > API
4. Copy the URL and anon/public key for later use

### 3. Deploy to Render

#### Option 1: Deploy using the Render Dashboard

1. Log in to your Render account
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: hyper-risk (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `./render-build.sh`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x (or another LTS version)
5. Add the following environment variables:
   - `NODE_ENV`: production
   - `PORT`: 3001
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_KEY`: Your Supabase anon/public key
   - `HYPERLIQUID_API_URL`: https://api.hyperliquid.xyz
   - `HYPERLIQUID_WS_URL`: wss://api.hyperliquid.xyz/ws
   - `RATE_LIMIT_WINDOW_MS`: 60000
   - `RATE_LIMIT_MAX_REQUESTS`: 100
   - `CORS_ORIGIN`: https://your-app-name.onrender.com (replace with your actual Render URL)
6. Click "Create Web Service"

#### Option 2: Deploy using Render Blueprint (render.yaml)

1. Push your code with the `render.yaml` file to your GitHub repository
2. Log in to your Render account
3. Click on "New" and select "Blueprint"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` file and create the services
6. You'll need to manually set the `SUPABASE_URL` and `SUPABASE_KEY` environment variables

### 4. Verify Deployment

1. Once the deployment is complete, Render will provide a URL for your application
2. Visit the URL to ensure the application is running correctly
3. Test the main functionality to verify everything works as expected

### 5. Custom Domain (Optional)

If you want to use a custom domain:

1. Go to your web service in the Render dashboard
2. Click on "Settings" and scroll to the "Custom Domain" section
3. Click "Add Custom Domain" and follow the instructions

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check the build logs in Render for specific errors
   - Ensure all dependencies are correctly specified in package.json files
   - Verify that the build script has execute permissions (`chmod +x render-build.sh`)

2. **Dependency Conflicts**:
   - If you encounter TypeScript version conflicts (ERESOLVE errors), make sure:
     - The TypeScript version in package.json is set to ^4.9.5 (compatible with react-scripts)
     - The render-build.sh script uses the `--legacy-peer-deps` flag during installation
     - The .npmrc file includes `legacy-peer-deps=true`
     - The package.json includes "overrides" and "resolutions" sections for TypeScript

3. **TypeScript Compilation Errors**:
   - If you encounter TypeScript errors about unused variables or imports:
     - Update tsconfig.json to set `"noUnusedLocals": false` and `"noUnusedParameters": false`
     - Use the `--skipLibCheck` flag with the TypeScript compiler
     - Temporarily rename problematic test files during the build process
     - For test files with errors, consider adding `// @ts-ignore` comments or fixing the issues

4. **Runtime Errors**:
   - Check the logs in the Render dashboard
   - Verify all environment variables are correctly set
   - Ensure the Supabase connection is working

5. **Frontend Not Loading**:
   - Verify that the frontend build was successful
   - Check that the static files are being served correctly
   - Inspect browser console for any JavaScript errors

### Getting Help

If you encounter issues not covered in this guide:

1. Check the Render documentation: https://render.com/docs
2. Review the Supabase documentation: https://supabase.com/docs
3. Examine the application logs in the Render dashboard

## Maintenance

### Updating Your Application

To update your application:

1. Make changes to your code locally
2. Commit and push to your GitHub repository
3. Render will automatically detect the changes and redeploy your application

### Monitoring

Render provides basic monitoring for your application:

1. Go to your web service in the Render dashboard
2. Click on "Logs" to view application logs
3. Set up alerts in the "Alerts" section for important events

## Security Considerations

1. Never commit sensitive information like API keys to your repository
2. Use environment variables for all sensitive configuration
3. Regularly update dependencies to patch security vulnerabilities
4. Consider setting up rate limiting for your API endpoints

---

This deployment guide should help you successfully deploy the Hyper Risk application to Render. If you have any questions or need further assistance, please refer to the documentation or contact support. 