#!/bin/bash

# This script demonstrates deploying to Netlify using the Netlify CLI
# Install: npm install -g netlify-cli

echo "🚀 Deploying Asset Manager Frontend to Netlify"
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found"
    echo "   Install it: npm install -g netlify-cli"
    exit 1
fi

echo "✅ Netlify CLI found"
echo ""

# Check environment variable
if [ -z "$VITE_API_BASE_URL" ]; then
    echo "⚠️  Warning: VITE_API_BASE_URL not set"
    echo "   You'll need to set this in Netlify dashboard after deployment"
    echo ""
fi

# Build the frontend
echo "📦 Building frontend..."
if npm run build:client; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🌐 Ready to deploy to Netlify"
echo ""
echo "Choose deployment option:"
echo "  1. Deploy to production:  netlify deploy --prod"
echo "  2. Deploy to preview:     netlify deploy"
echo "  3. Link existing site:    netlify link"
echo "  4. Create new site:       netlify init"
echo ""
echo "Run the appropriate command above to deploy"
echo ""
