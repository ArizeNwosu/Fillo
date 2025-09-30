#!/bin/bash

# Privatas Backend Setup Script
# This script sets up the backend API server

set -e  # Exit on error

echo "🚀 Setting up Privatas Backend API Server..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Create server directory if it doesn't exist
if [ ! -d "server" ]; then
    echo "📁 Creating server directory..."
    mkdir -p server
fi

cd server

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: server/package.json not found. Please ensure the server files are in place."
    exit 1
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created. Please edit server/.env with your API keys."
        echo ""
        echo "Required environment variables:"
        echo "  - VITE_GEMINI_API_KEY (your Gemini API key)"
        echo "  - PORT (default: 3001)"
        echo "  - CLIENT_URL (your frontend URL)"
        echo ""
    else
        echo "⚠️  Warning: .env.example not found. Creating basic .env..."
        cat > .env << 'EOF'
# Backend API Server Environment Variables

# Gemini API Key (REQUIRED - keep this secret!)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:3005
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW=60000
MAX_REQUESTS_PER_WINDOW=30
EOF
        echo "✅ Basic .env file created. Please edit server/.env with your API keys."
    fi
else
    echo "✅ .env file already exists"
fi

cd ..

# Check if frontend .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating frontend .env.local from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ .env.local file created. Please edit .env.local with your Firebase config."
    else
        echo "⚠️  Warning: .env.example not found. Please create .env.local manually."
    fi
else
    echo "✅ Frontend .env.local already exists"
fi

echo ""
echo "✨ Backend setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit server/.env with your Gemini API key"
echo "  2. Edit .env.local with your Firebase configuration"
echo "  3. Start the backend: npm run server"
echo "  4. Start the frontend: npm run dev"
echo ""
echo "Or run both together: npm run start:all"
echo ""
echo "📚 For more information, see PRODUCTION_READY.md"