#!/bin/bash

# LearnMate UI - Development Server Startup Script
# This script helps you start the development server quickly

echo "🎓 LearnMate South Sudan - Starting Development Server"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the learn_mate_ui directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
    echo "✅ Created .env.local"
    echo ""
fi

# Display instructions
echo "✅ Ready to start!"
echo ""
echo "📋 Before you continue:"
echo "   1. Make sure the API server is running on http://localhost:5000"
echo "   2. Check ../learn_mate_api is started with 'npm start'"
echo ""
echo "🚀 Starting Next.js development server..."
echo ""
echo "Once started, open your browser to:"
echo "   → http://localhost:3000"
echo ""
echo "📚 Documentation available:"
echo "   → QUICKSTART.md - Get started in 5 minutes"
echo "   → SETUP.md - Detailed setup guide"
echo "   → DOCUMENTATION_INDEX.md - Full documentation index"
echo ""
echo "Press Ctrl+C to stop the server"
echo "=================================================="
echo ""

# Start the development server
npm run dev
