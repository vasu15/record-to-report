#!/bin/bash

# Asset Manager - Netlify Deployment Helper
# This script helps prepare your project for Netlify deployment

set -e

echo "🚀 Asset Manager - Netlify Deployment Helper"
echo "============================================"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: This is not a git repository."
    echo "   Initialize git first: git init"
    exit 1
fi

echo "✅ Git repository detected"

# Check if netlify.toml exists
if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml found"
else
    echo "❌ netlify.toml not found"
    exit 1
fi

# Check for required files
echo ""
echo "📋 Checking required files..."
required_files=("package.json" "vite.config.ts" "client/index.html")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file not found"
        exit 1
    fi
done

# Test build
echo ""
echo "🔨 Testing client build..."
if npm run build:client; then
    echo "✅ Client build successful"
else
    echo "❌ Client build failed"
    exit 1
fi

# Check build output
if [ -d "dist/public" ]; then
    echo "✅ Build output directory exists (dist/public)"
    file_count=$(find dist/public -type f | wc -l)
    echo "   📦 Generated $file_count files"
else
    echo "❌ Build output directory not found"
    exit 1
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Deploy your backend to Render or Railway (see DEPLOYMENT.md)"
echo "   2. Note your backend URL"
echo "   3. Push code to GitHub: git push origin main"
echo "   4. Connect repository to Netlify"
echo "   5. Set VITE_API_BASE_URL in Netlify environment variables"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
