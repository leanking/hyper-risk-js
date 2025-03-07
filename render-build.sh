#!/usr/bin/env bash
# Exit on error
set -o errexit

# Build backend
npm install
npm run build

# Build frontend
cd src/frontend
npm install
npm run build
cd ../..

# Copy frontend build to public directory for serving
mkdir -p dist/public
cp -r src/frontend/build/* dist/public/ 