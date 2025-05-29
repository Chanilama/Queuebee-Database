#!/usr/bin/env python3
import os
import sys
import json
from pymongo import MongoClient
from bson import json_util
from datetime import datetime

# Get the MongoDB URL from the backend .env file
def get_mongo_url():
    with open('/app/backend/.env', 'r') as f:
        for line in f:
            if line.startswith('MONGO_URL='):
                return line.strip().split('=')[1].strip('"\'')
    return None

MONGO_URL = get_mongo_url()
if not MONGO_URL:
    print("Error: Could not find MONGO_URL in backend/.env")
    sys.exit(1)

print(f"Using MongoDB URL: {MONGO_URL}")

# Connect to MongoDB
try:
    client = MongoClient(MONGO_URL)
    db = client.queuebee
    print("✅ Successfully connected to MongoDB")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {str(e)}")
    sys.exit(1)

# Helper function to parse MongoDB documents
def parse_json(data):
    return json.loads(json_util.dumps(data))

# Check database status
def check_database_status():
    print("\n=== QueueBee Database Status ===")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # Check collections
    collections = db.list_collection_names()
    print(f"\nCollections in database: {', '.join(collections)}")
    
    # 1. Check Salon Data
    salon_count = db.salons.count_documents({})
    print(f"\n=== Salon Data ({salon_count} salons) ===")
    
    if salon_count > 0:
        print("\nSalon List:")
        for salon in db.salons.find({}, {"password": 0}):
            print(f"  - ID: {salon.get('id')}")
            print(f"    Name: {salon.get('salon_name')}")
            print(f"    Owner: {salon.get('owner_name')}")
            print(f"    Email: {salon.get('email')}")
            print(f"    Address: {salon.get('address')}")
            print(f"    Created: {salon.get('created_at')}")
            print(f"    Points per check-in: {salon.get('points_per_checkin', 10)}")
            print(f"    Subscription: {salon.get('subscription_plan', 'free')}")
            print()
    else:
        print("No salons found in the database.")
    
    # 2. Check Customer Data
    customer_count = db.customers.count_documents({})
    print(f"\n=== Customer Data ({customer_count} customers) ===")
    
    # Group customers by salon
    salon_customer_counts = {}
    for customer in db.customers.find({}, {"salon_id": 1}):
        salon_id = customer.get('salon_id')
        if salon_id in salon_customer_counts:
            salon_customer_counts[salon_id] += 1
        else:
            salon_customer_counts[salon_id] = 1
    
    if salon_customer_counts:
        print("\nCustomers by Salon:")
        for salon_id, count in salon_customer_counts.items():
            salon = db.salons.find_one({"id": salon_id})
            salon_name = salon.get('salon_name', 'Unknown Salon') if salon else f"Unknown Salon ({salon_id})"
            print(f"  - {salon_name}: {count} customers")
        
        # Show loyalty tier distribution
        loyalty_tiers = {"Bronze": 0, "Silver": 0, "Gold": 0, "Platinum": 0}
        for customer in db.customers.find({}, {"loyalty_tier": 1}):
            tier = customer.get('loyalty_tier', 'Bronze')
            if tier in loyalty_tiers:
                loyalty_tiers[tier] += 1
        
        print("\nLoyalty Tier Distribution:")
        for tier, count in loyalty_tiers.items():
            print(f"  - {tier}: {count} customers")
    else:
        print("No customers found in the database.")
    
    # 3. Check Queue Data
    queue_count = db.queue.count_documents({})
    waiting_count = db.queue.count_documents({"status": "waiting"})
    completed_count = db.queue.count_documents({"status": "completed"})
    
    print(f"\n=== Queue Data ({queue_count} entries) ===")
    print(f"  - Waiting: {waiting_count}")
    print(f"  - Completed: {completed_count}")
    
    if waiting_count > 0:
        print("\nCurrent Queue Entries:")
        for entry in db.queue.find({"status": "waiting"}).sort("checkin_time", 1):
            print(f"  - Position: {entry.get('position')}")
            print(f"    Customer: {entry.get('customer_name')}")
            print(f"    Service: {entry.get('service_type')}")
            print(f"    Check-in Time: {entry.get('checkin_time')}")
            print(f"    Points Awarded: {entry.get('points_awarded', 0)}")
            print()
    
    # 4. Check Points Transactions
    points_count = db.points_transactions.count_documents({})
    print(f"\n=== Points Transactions ({points_count} transactions) ===")
    
    if points_count > 0:
        # Calculate total points awarded
        total_points = 0
        for transaction in db.points_transactions.find({}):
            total_points += transaction.get('points', 0)
        
        print(f"  - Total Points Awarded: {total_points}")
        
        # Show recent transactions
        print("\nRecent Points Transactions:")
        for transaction in db.points_transactions.find({}).sort("timestamp", -1).limit(5):
            print(f"  - Transaction ID: {transaction.get('id')}")
            print(f"    Customer ID: {transaction.get('customer_id')}")
            print(f"    Type: {transaction.get('transaction_type')}")
            print(f"    Points: {transaction.get('points')}")
            print(f"    Description: {transaction.get('description')}")
            print(f"    Timestamp: {transaction.get('timestamp')}")
            print()
    else:
        print("No points transactions found in the database.")
    
    # Summary
    print("\n=== Database Status Summary ===")
    print(f"  - Salons: {salon_count}")
    print(f"  - Customers: {customer_count}")
    print(f"  - Queue Entries: {queue_count} (Waiting: {waiting_count}, Completed: {completed_count})")
    print(f"  - Points Transactions: {points_count}")
    
    if salon_count > 0 and customer_count > 0 and queue_count > 0 and points_count > 0:
        print("\n✅ Database is populated and appears to be working correctly.")
        print("✅ Data persistence is confirmed for all main entities.")
    else:
        print("\n⚠️ Database may be missing data in some collections.")
        if salon_count == 0:
            print("❌ No salons found - salon registration may not be working.")
        if customer_count == 0:
            print("❌ No customers found - customer creation may not be working.")
        if queue_count == 0:
            print("❌ No queue entries found - check-in functionality may not be working.")
        if points_count == 0:
            print("❌ No points transactions found - loyalty system may not be working.")

if __name__ == "__main__":
    check_database_status()