import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_mongodb_connection():
    """Check if MongoDB connection is working"""
    print("\n=== Checking MongoDB Connection ===")
    try:
        # Get MongoDB URL from environment
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        print(f"Using MongoDB URL: {mongo_url}")
        
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongo_url)
        db = client.queuebee
        
        # Check connection by listing collections
        collections = await db.list_collection_names()
        print(f"Collections in database: {collections}")
        
        # Count documents in salons collection
        salon_count = await db.salons.count_documents({})
        print(f"Number of salon documents: {salon_count}")
        
        # List some salon documents if they exist
        if salon_count > 0:
            print("\nSalon documents:")
            async for salon in db.salons.find({}, {"password": 0}).limit(5):
                print(f"  - {salon.get('salon_name', 'Unknown')} (ID: {salon.get('id', 'Unknown')})")
        
        print("\nMongoDB connection is working!")
        return True
    except Exception as e:
        print(f"MongoDB connection error: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(check_mongodb_connection())