#!/usr/bin/env python3
"""
Startup script that automatically restores database if backup exists
"""

import asyncio
import os
import sys

# Add the scripts directory to Python path
sys.path.append('/app/scripts')

from backup_database import restore_database, BACKUP_DIR

async def startup_restore():
    """Check for existing backup and restore if available"""
    latest_backup = os.path.join(BACKUP_DIR, "latest")
    
    if os.path.exists(latest_backup):
        print("🔄 Found existing backup, restoring data...")
        success = await restore_database(latest_backup)
        if success:
            print("✅ Data successfully restored from previous session!")
        else:
            print("❌ Failed to restore data")
    else:
        print("📁 No previous backup found, starting with fresh database")

if __name__ == "__main__":
    asyncio.run(startup_restore())