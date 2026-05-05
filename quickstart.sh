#!/bin/bash
# Quick start script for Signal Grid

echo "🔮 SIGNAL GRID - Quick Start"
echo "=============================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+"
    exit 1
fi

echo "✅ Python 3 found"

# Install dependencies
echo "📦 Installing dependencies..."
pip3 install -q requests youtube-transcript-api

echo "✅ Dependencies installed"
echo ""

# Check for API keys
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set (scraper will use mock data)"
else
    echo "✅ Claude API key found"
fi

if [ -z "$YOUTUBE_API_KEY" ]; then
    echo "⚠️  YOUTUBE_API_KEY not set (video scraping disabled)"
else
    echo "✅ YouTube API key found"
fi

echo ""
echo "Choose an option:"
echo "1) Run scraper (generates new data.json)"
echo "2) Start local web server (view current data)"
echo "3) Both (scrape then serve)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🤖 Running scraper..."
        python3 scraper.py
        echo ""
        echo "✅ Scraping complete! Check data.json"
        ;;
    2)
        echo ""
        echo "🌐 Starting web server at http://localhost:8000"
        echo "   Press Ctrl+C to stop"
        echo ""
        python3 -m http.server 8000
        ;;
    3)
        echo ""
        echo "🤖 Running scraper..."
        python3 scraper.py
        echo ""
        echo "✅ Scraping complete!"
        echo ""
        echo "🌐 Starting web server at http://localhost:8000"
        echo "   Press Ctrl+C to stop"
        echo ""
        python3 -m http.server 8000
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
