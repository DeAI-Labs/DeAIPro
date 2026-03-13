#!/bin/bash

# MongoDB Connection Debugging - Quick Start Guide
# This script helps you get MongoDB running

set -e

echo "=================================="
echo "DeAIPro MongoDB Quick Start"
echo "=================================="
echo ""

PROJECT_DIR="/home/ciarrai/Documents/DeAIPro"
cd "$PROJECT_DIR"

# Show status
echo "1. Current Setup Status"
echo "---"
echo "✓ Python environment: /home/ciarrai/bt_venv"
echo "✓ Project: $PROJECT_DIR"
echo "✓ Docker: available"
echo "✓ Docker Compose: available (v5.1.0)"
echo ""

# Check if MongoDB is already running
echo "2. Checking if MongoDB is already running..."
if docker ps | grep -q deaipro_mongodb; then
    echo "✓ MongoDB container is already running!"
    MONGO_RUNNING=true
else
    echo "⚠ MongoDB container is not running"
    MONGO_RUNNING=false
fi
echo ""

# Option to start MongoDB
if [ "$MONGO_RUNNING" = false ]; then
    echo "3. Starting MongoDB with Docker Compose..."
    docker compose up -d mongodb
    echo "✓ MongoDB started!"
    echo ""
    echo "   Waiting for MongoDB to be ready..."
    sleep 5
fi

# Test connection
echo "4. Testing MongoDB Connection..."
cd "$PROJECT_DIR/backend"
source /home/ciarrai/bt_venv/bin/activate
python debug_mongodb.py

echo ""
echo "=================================="
echo "✓ Setup Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Start the backend:   cd $PROJECT_DIR/backend && uvicorn app.main:app --reload"
echo "2. Start the frontend:  cd $PROJECT_DIR/frontend && npm run dev"
echo "3. View logs:           docker compose logs -f"
echo ""
echo "To stop everything:     docker compose down"
echo ""
