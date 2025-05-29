#!/bin/bash

# QueueBee Startup Automation Script
# This script runs data restore on startup to ensure persistence

echo "🚀 QueueBee Startup Automation"
echo "================================"

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 3

# Check if backup directory exists
if [ ! -d "/app/data_backups" ]; then
    echo "📁 Creating backup directory..."
    mkdir -p /app/data_backups
fi

# Run startup restore script
echo "🔄 Running startup restore..."
/root/.venv/bin/python3 /app/scripts/startup_restore.py

echo "✅ Startup automation completed!"