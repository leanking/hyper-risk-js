#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== STEP 1: Installing root dependencies ==="
npm install --legacy-peer-deps

echo "=== STEP 2: Building backend ==="
# Create a temporary TypeScript configuration for the build
echo "Creating temporary TypeScript configuration..."
cat > tsconfig.build.json << EOL
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "skipLibCheck": true,
    "outDir": "./dist"
  }
}
EOL

# Build backend
echo "Building backend with TypeScript..."
npx tsc --project tsconfig.build.json

# Verify backend build
if [ -d "dist/backend" ]; then
  echo "Backend build successful!"
else
  echo "Error: Backend build failed!"
  exit 1
fi

echo "=== STEP 3: Building frontend ==="
# Navigate to frontend directory
cd src/frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Build frontend with warnings disabled
echo "Building frontend..."
export DISABLE_ESLINT_PLUGIN=true
CI=false GENERATE_SOURCEMAP=false npm run build

# Verify frontend build
if [ -d "build" ]; then
  echo "Frontend build successful!"
else
  echo "Error: Frontend build failed!"
  exit 1
fi

# Return to root directory
cd ../..

echo "=== STEP 4: Setup production files ==="
# Create dist/public directory
mkdir -p dist/public

# Copy frontend build to public directory
echo "Copying frontend build to dist/public..."
cp -r src/frontend/build/* dist/public/

# Create module alias register file
echo "Creating module-alias register file..."
cat > dist/register.js << EOL
require('module-alias/register');
require('module-alias').addAliases({
  '@backend': __dirname + '/backend',
  '@frontend': __dirname + '/frontend',
  '@shared': __dirname + '/shared'
});
EOL

# Update server.js to use register file
if [ -f dist/backend/server.js ]; then
  echo "Updating server.js to use module-alias..."
  sed -i.bak '1s/^/require("..\/register");\n/' dist/backend/server.js
  rm dist/backend/server.js.bak
fi

# Clean up
echo "Cleaning up..."
rm tsconfig.build.json

echo "=== Build completed successfully! ===" 