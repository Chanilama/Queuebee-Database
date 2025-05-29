#!/usr/bin/env python3
"""
Database Backup and Restore System for QueueBee
Creates persistent backups that survive container restarts
"""

import asyncio
import json
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import argparse

BACKUP_DIR = "/app/data_backups"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')

async def backup_database():
    """Backup all collections to JSON files"""
    print("🔄 Starting database backup...")
    
    # Ensure backup directory exists
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client.queuebee
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_folder = os.path.join(BACKUP_DIR, f"backup_{timestamp}")
        os.makedirs(backup_folder, exist_ok=True)
        
        # Get all collections
        collections = await db.list_collection_names()
        print(f"📋 Found collections: {collections}")
        
        backup_info = {
            "timestamp": timestamp,
            "collections": {},
            "total_documents": 0
        }
        
        for collection_name in collections:
            collection = db[collection_name]
            documents = []
            
            async for doc in collection.find():
                # Convert ObjectId to string if present
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
                documents.append(doc)
            
            # Save collection to file
            file_path = os.path.join(backup_folder, f"{collection_name}.json")
            with open(file_path, 'w') as f:
                json.dump(documents, f, indent=2, default=str)
            
            backup_info["collections"][collection_name] = len(documents)
            backup_info["total_documents"] += len(documents)
            
            print(f"✅ Backed up {collection_name}: {len(documents)} documents")
        
        # Save backup info
        info_path = os.path.join(backup_folder, "backup_info.json")
        with open(info_path, 'w') as f:
            json.dump(backup_info, f, indent=2)
        
        # Create "latest" symlink
        latest_path = os.path.join(BACKUP_DIR, "latest")
        if os.path.exists(latest_path):
            os.remove(latest_path)
        os.symlink(backup_folder, latest_path)
        
        print(f"🎉 Backup completed successfully!")
        print(f"📁 Backup location: {backup_folder}")
        print(f"📊 Total documents backed up: {backup_info['total_documents']}")
        
        return backup_folder
        
    except Exception as e:
        print(f"❌ Backup failed: {str(e)}")
        return None

async def restore_database(backup_path=None):
    """Restore database from backup"""
    if backup_path is None:
        backup_path = os.path.join(BACKUP_DIR, "latest")
    
    if not os.path.exists(backup_path):
        print(f"❌ Backup path not found: {backup_path}")
        return False
    
    print(f"🔄 Starting database restore from: {backup_path}")
    
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client.queuebee
        
        # Load backup info
        info_path = os.path.join(backup_path, "backup_info.json")
        if os.path.exists(info_path):
            with open(info_path, 'r') as f:
                backup_info = json.load(f)
            print(f"📋 Restoring backup from: {backup_info['timestamp']}")
        
        # Find all JSON files in backup directory
        json_files = [f for f in os.listdir(backup_path) if f.endswith('.json') and f != 'backup_info.json']
        
        total_restored = 0
        for json_file in json_files:
            collection_name = json_file[:-5]  # Remove .json extension
            file_path = os.path.join(backup_path, json_file)
            
            with open(file_path, 'r') as f:
                documents = json.load(f)
            
            if documents:
                # Clear existing collection
                await db[collection_name].delete_many({})
                
                # Insert documents
                await db[collection_name].insert_many(documents)
                total_restored += len(documents)
                
                print(f"✅ Restored {collection_name}: {len(documents)} documents")
        
        print(f"🎉 Restore completed successfully!")
        print(f"📊 Total documents restored: {total_restored}")
        return True
        
    except Exception as e:
        print(f"❌ Restore failed: {str(e)}")
        return False

async def list_backups():
    """List all available backups"""
    if not os.path.exists(BACKUP_DIR):
        print("📁 No backups found")
        return
    
    backups = [d for d in os.listdir(BACKUP_DIR) if d.startswith('backup_') and os.path.isdir(os.path.join(BACKUP_DIR, d))]
    backups.sort(reverse=True)
    
    print("📋 Available backups:")
    for backup in backups:
        backup_path = os.path.join(BACKUP_DIR, backup)
        info_path = os.path.join(backup_path, "backup_info.json")
        
        if os.path.exists(info_path):
            with open(info_path, 'r') as f:
                info = json.load(f)
            print(f"  📅 {backup} - {info['total_documents']} documents")
        else:
            print(f"  📅 {backup}")

async def auto_backup():
    """Create automatic backup if none exists"""
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR, exist_ok=True)
    
    latest_path = os.path.join(BACKUP_DIR, "latest")
    if not os.path.exists(latest_path):
        print("🔄 No backup found, creating initial backup...")
        await backup_database()
    else:
        print("✅ Backup already exists")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="QueueBee Database Backup/Restore")
    parser.add_argument("action", choices=["backup", "restore", "list", "auto"], help="Action to perform")
    parser.add_argument("--path", help="Backup path for restore operation")
    
    args = parser.parse_args()
    
    if args.action == "backup":
        asyncio.run(backup_database())
    elif args.action == "restore":
        asyncio.run(restore_database(args.path))
    elif args.action == "list":
        asyncio.run(list_backups())
    elif args.action == "auto":
        asyncio.run(auto_backup())