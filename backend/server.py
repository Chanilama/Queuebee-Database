from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
import uvicorn
import os
from datetime import datetime, timedelta
import uuid
import hashlib
import jwt
from typing import Optional, List, Dict, Any
import logging
from bson import ObjectId
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="QueueBee API", description="Self-Service Queue Management Platform")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.queuebee

# JWT configuration
JWT_SECRET = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Pydantic models
class SalonOwnerRegister(BaseModel):
    email: EmailStr
    password: str
    salon_name: str
    owner_name: str
    phone: str
    address: str

class SalonOwnerLogin(BaseModel):
    email: EmailStr
    password: str

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None

class UpdateCustomerPoints(BaseModel):
    points: int
    reason: Optional[str] = "Manual adjustment"

class CheckInRequest(BaseModel):
    customer_id: str
    service_type: Optional[str] = "General"

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_salon(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        salon_id: str = payload.get("salon_id")
        if salon_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        return salon_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Helper function to handle MongoDB document serialization
def serialize_document(doc):
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_document(item) for item in doc]
    
    if isinstance(doc, dict):
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                doc[k] = str(v)
            elif isinstance(v, (dict, list)):
                doc[k] = serialize_document(v)
        
        # Remove _id field if it exists
        if '_id' in doc:
            del doc['_id']
            
        return doc
    
    return doc

# API Routes

# Public API Routes (no authentication required)
@app.get("/api/public/salon/{salon_id}")
async def get_public_salon_info(salon_id: str):
    """Get public salon information"""
    salon = await db.salons.find_one({"id": salon_id}, {"password": 0, "email": 0})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return {
        "salon_name": salon["salon_name"],
        "address": salon["address"],
        "owner_name": salon["owner_name"]
    }

@app.get("/api/public/queue/{salon_id}")
async def get_public_queue(salon_id: str):
    """Get current queue for public display"""
    queue = []
    async for entry in db.queue.find({"salon_id": salon_id, "status": "waiting"}).sort("checkin_time", 1):
        # Get customer info for tier display
        customer = await db.customers.find_one({"id": entry["customer_id"]})
        queue_item = {
            "id": entry["id"],
            "position": entry["position"],
            "customer_name": entry["customer_name"],
            "service_type": entry["service_type"],
            "estimated_wait": entry["estimated_wait"],
            "points_awarded": entry.get("points_awarded", 0)
        }
        if customer:
            queue_item["customer_tier"] = customer.get("loyalty_tier", "Bronze")
        queue.append(queue_item)
    return queue

@app.post("/api/public/customer-checkin")
async def public_customer_checkin(checkin_data: dict):
    """Public customer check-in endpoint"""
    try:
        salon_id = checkin_data["salon_id"]
        name = checkin_data["name"]
        email = checkin_data.get("email", "")
        phone = checkin_data.get("phone", "")
        service_type = checkin_data.get("service_type", "Walk-in")
        
        # Get salon settings
        salon = await db.salons.find_one({"id": salon_id})
        if not salon:
            raise HTTPException(status_code=404, detail="Salon not found")
        
        # Find or create customer
        customer = await db.customers.find_one({
            "salon_id": salon_id,
            "$or": [
                {"email": email} if email else {},
                {"phone": phone} if phone else {},
                {"name": name, "email": email} if email else {"name": name}
            ]
        })
        
        if not customer:
            # Create new customer
            customer_id = str(uuid.uuid4())
            customer = {
                "id": customer_id,
                "salon_id": salon_id,
                "name": name,
                "phone": phone,
                "email": email,
                "total_points": 0,
                "lifetime_points": 0,
                "total_visits": 0,
                "loyalty_tier": "Bronze",
                "created_at": datetime.utcnow().isoformat(),
                "last_visit": None,
                "is_active": True
            }
            await db.customers.insert_one(customer)
        else:
            customer_id = customer["id"]
            # Update customer info if provided
            update_data = {}
            if email and customer.get("email") != email:
                update_data["email"] = email
            if phone and customer.get("phone") != phone:
                update_data["phone"] = phone
            if update_data:
                await db.customers.update_one({"id": customer_id}, {"$set": update_data})
                # Refresh customer data
                customer = await db.customers.find_one({"id": customer_id})
        
        # Calculate points to award
        base_points = salon.get("points_per_checkin", 10)
        loyalty_tiers = salon.get("settings", {}).get("loyalty_tiers", [])
        
        # Find customer's current tier multiplier
        multiplier = 1.0
        for tier in loyalty_tiers:
            if customer["total_points"] >= tier["min_points"]:
                multiplier = tier["multiplier"]
        
        points_awarded = int(base_points * multiplier)
        
        # Create queue entry
        queue_id = str(uuid.uuid4())
        
        # Calculate queue position
        queue_count = await db.queue.count_documents({"salon_id": salon_id, "status": "waiting"})
        position = queue_count + 1
        estimated_wait = queue_count * 15  # 15 minutes per person
        
        queue_entry = {
            "id": queue_id,
            "salon_id": salon_id,
            "customer_id": customer_id,
            "customer_name": name,
            "service_type": service_type,
            "checkin_time": datetime.utcnow().isoformat(),
            "status": "waiting",
            "position": position,
            "estimated_wait": estimated_wait,
            "points_awarded": points_awarded
        }
        
        await db.queue.insert_one(queue_entry)
        
        # Update customer points and stats
        new_total_points = customer["total_points"] + points_awarded
        new_lifetime_points = customer["lifetime_points"] + points_awarded
        new_total_visits = customer["total_visits"] + 1
        
        # Determine new loyalty tier
        new_tier = "Bronze"
        for tier in sorted(loyalty_tiers, key=lambda x: x["min_points"], reverse=True):
            if new_total_points >= tier["min_points"]:
                new_tier = tier["name"]
                break
        
        await db.customers.update_one(
            {"id": customer_id},
            {
                "$set": {
                    "total_points": new_total_points,
                    "lifetime_points": new_lifetime_points,
                    "total_visits": new_total_visits,
                    "loyalty_tier": new_tier,
                    "last_visit": datetime.utcnow().isoformat()
                }
            }
        )
        
        # Create points transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "salon_id": salon_id,
            "customer_id": customer_id,
            "transaction_type": "earned",
            "points": points_awarded,
            "description": f"Check-in for {service_type}",
            "timestamp": datetime.utcnow().isoformat(),
            "queue_id": queue_id
        }
        
        await db.points_transactions.insert_one(transaction)
        
        # Serialize the queue entry to handle ObjectId
        serialized_queue_entry = serialize_document(queue_entry)
        
        return {
            "message": "Check-in successful",
            "customer_name": name,
            "queue_entry": serialized_queue_entry,
            "points_awarded": points_awarded,
            "total_points": new_total_points,
            "loyalty_tier": new_tier,
            "tier_upgraded": new_tier != customer["loyalty_tier"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Public check-in error: {str(e)}")
        raise HTTPException(status_code=500, detail="Check-in failed")

@app.get("/api/")
async def health_check():
    return {"message": "QueueBee API is running", "version": "2.0"}

# Salon Owner Authentication Routes
@app.post("/api/salon/register")
async def register_salon_owner(salon_data: SalonOwnerRegister):
    """Register a new salon owner"""
    try:
        # Check if email already exists
        existing_salon = await db.salons.find_one({"email": salon_data.email})
        if existing_salon:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create salon record
        salon_id = str(uuid.uuid4())
        salon_doc = {
            "id": salon_id,
            "email": salon_data.email,
            "password": hash_password(salon_data.password),
            "salon_name": salon_data.salon_name,
            "owner_name": salon_data.owner_name,
            "phone": salon_data.phone,
            "address": salon_data.address,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True,
            "subscription_plan": "free",
            "points_per_checkin": 10,  # Default points per check-in
            "settings": {
                "points_enabled": True,
                "loyalty_tiers": [
                    {"name": "Bronze", "min_points": 0, "multiplier": 1.0},
                    {"name": "Silver", "min_points": 100, "multiplier": 1.2},
                    {"name": "Gold", "min_points": 500, "multiplier": 1.5},
                    {"name": "Platinum", "min_points": 1000, "multiplier": 2.0}
                ]
            }
        }
        
        await db.salons.insert_one(salon_doc)
        
        # Create access token
        access_token = create_access_token({"salon_id": salon_id})
        
        return {
            "message": "Salon registered successfully",
            "salon_id": salon_id,
            "access_token": access_token,
            "salon_name": salon_data.salon_name
        }
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/api/salon/login")
async def login_salon_owner(login_data: SalonOwnerLogin):
    """Login salon owner"""
    try:
        salon = await db.salons.find_one({"email": login_data.email})
        if not salon or not verify_password(login_data.password, salon["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not salon.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account is deactivated")
        
        access_token = create_access_token({"salon_id": salon["id"]})
        
        return {
            "access_token": access_token,
            "salon_id": salon["id"],
            "salon_name": salon["salon_name"],
            "owner_name": salon["owner_name"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/api/salon/profile")
async def get_salon_profile(salon_id: str = Depends(get_current_salon)):
    """Get salon profile"""
    salon = await db.salons.find_one({"id": salon_id}, {"password": 0})
    if not salon:
        raise HTTPException(status_code=404, detail="Salon not found")
    return serialize_document(salon)

# Customer Management Routes
@app.post("/api/customers")
async def create_customer(customer_data: CustomerCreate, salon_id: str = Depends(get_current_salon)):
    """Create a new customer for the salon"""
    try:
        # Check if customer already exists for this salon
        existing = await db.customers.find_one({
            "salon_id": salon_id,
            "$or": [
                {"phone": customer_data.phone},
                {"email": customer_data.email} if customer_data.email else {}
            ]
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Customer with this phone/email already exists")
        
        customer_id = str(uuid.uuid4())
        customer_doc = {
            "id": customer_id,
            "salon_id": salon_id,
            "name": customer_data.name,
            "phone": customer_data.phone,
            "email": customer_data.email,
            "notes": "",  # Initialize with empty notes
            "total_points": 0,
            "lifetime_points": 0,
            "total_visits": 0,
            "loyalty_tier": "Bronze",
            "created_at": datetime.utcnow().isoformat(),
            "last_visit": None,
            "is_active": True
        }
        
        await db.customers.insert_one(customer_doc)
        
        return {
            "message": "Customer created successfully",
            "customer": serialize_document(customer_doc)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Customer creation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create customer")

@app.get("/api/customers")
async def get_customers(salon_id: str = Depends(get_current_salon)):
    """Get all customers for the salon"""
    customers = []
    async for customer in db.customers.find({"salon_id": salon_id, "is_active": True}):
        customers.append(customer)
    return serialize_document(customers)

@app.get("/api/customers/{customer_id}")
async def get_customer(customer_id: str, salon_id: str = Depends(get_current_salon)):
    """Get specific customer"""
    customer = await db.customers.find_one({"id": customer_id, "salon_id": salon_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return serialize_document(customer)

@app.put("/api/customers/{customer_id}")
async def update_customer(customer_id: str, customer_data: CustomerUpdate, salon_id: str = Depends(get_current_salon)):
    """Update customer information"""
    update_data = {k: v for k, v in customer_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    result = await db.customers.update_one(
        {"id": customer_id, "salon_id": salon_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    updated_customer = await db.customers.find_one({"id": customer_id, "salon_id": salon_id})
    return {"message": "Customer updated successfully", "customer": serialize_document(updated_customer)}

# Queue and Check-in Routes with Points System
@app.post("/api/checkin")
async def customer_checkin(checkin_data: CheckInRequest, salon_id: str = Depends(get_current_salon)):
    """Check-in customer and award points"""
    try:
        # Get salon settings
        salon = await db.salons.find_one({"id": salon_id})
        if not salon:
            raise HTTPException(status_code=404, detail="Salon not found")
        
        # Get customer
        customer = await db.customers.find_one({"id": checkin_data.customer_id, "salon_id": salon_id})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Calculate points to award
        base_points = salon.get("points_per_checkin", 10)
        loyalty_tiers = salon.get("settings", {}).get("loyalty_tiers", [])
        
        # Find customer's current tier multiplier
        multiplier = 1.0
        for tier in loyalty_tiers:
            if customer["total_points"] >= tier["min_points"]:
                multiplier = tier["multiplier"]
        
        points_awarded = int(base_points * multiplier)
        
        # Create queue entry
        queue_id = str(uuid.uuid4())
        queue_entry = {
            "id": queue_id,
            "salon_id": salon_id,
            "customer_id": checkin_data.customer_id,
            "customer_name": customer["name"],
            "service_type": checkin_data.service_type,
            "checkin_time": datetime.utcnow().isoformat(),
            "status": "waiting",
            "position": 1,  # Will be calculated properly
            "estimated_wait": 15,  # Will be calculated properly
            "points_awarded": points_awarded
        }
        
        # Calculate queue position
        queue_count = await db.queue.count_documents({"salon_id": salon_id, "status": "waiting"})
        queue_entry["position"] = queue_count + 1
        queue_entry["estimated_wait"] = queue_count * 15  # 15 minutes per person
        
        await db.queue.insert_one(queue_entry)
        
        # Update customer points and stats
        new_total_points = customer["total_points"] + points_awarded
        new_lifetime_points = customer["lifetime_points"] + points_awarded
        new_total_visits = customer["total_visits"] + 1
        
        # Determine new loyalty tier
        new_tier = "Bronze"
        for tier in sorted(loyalty_tiers, key=lambda x: x["min_points"], reverse=True):
            if new_total_points >= tier["min_points"]:
                new_tier = tier["name"]
                break
        
        await db.customers.update_one(
            {"id": checkin_data.customer_id},
            {
                "$set": {
                    "total_points": new_total_points,
                    "lifetime_points": new_lifetime_points,
                    "total_visits": new_total_visits,
                    "loyalty_tier": new_tier,
                    "last_visit": datetime.utcnow().isoformat()
                }
            }
        )
        
        # Create points transaction record
        transaction = {
            "id": str(uuid.uuid4()),
            "salon_id": salon_id,
            "customer_id": checkin_data.customer_id,
            "transaction_type": "earned",
            "points": points_awarded,
            "description": f"Check-in for {checkin_data.service_type}",
            "timestamp": datetime.utcnow().isoformat(),
            "queue_id": queue_id
        }
        
        await db.points_transactions.insert_one(transaction)
        
        return {
            "message": "Check-in successful",
            "queue_entry": serialize_document(queue_entry),
            "points_awarded": points_awarded,
            "total_points": new_total_points,
            "loyalty_tier": new_tier,
            "tier_upgraded": new_tier != customer["loyalty_tier"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Check-in error: {str(e)}")
        raise HTTPException(status_code=500, detail="Check-in failed")

@app.get("/api/queue")
async def get_queue(salon_id: str = Depends(get_current_salon)):
    """Get current queue for the salon"""
    queue = []
    async for entry in db.queue.find({"salon_id": salon_id, "status": "waiting"}).sort("checkin_time", 1):
        queue.append(entry)
    return serialize_document(queue)

@app.put("/api/queue/{queue_id}/complete")
async def complete_service(queue_id: str, salon_id: str = Depends(get_current_salon)):
    """Mark service as completed"""
    result = await db.queue.update_one(
        {"id": queue_id, "salon_id": salon_id},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow().isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    return {"message": "Service marked as completed"}

@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics(salon_id: str = Depends(get_current_salon)):
    """Get dashboard analytics for the salon"""
    try:
        # Get today's stats
        today = datetime.utcnow().date().isoformat()
        
        # Total customers
        total_customers = await db.customers.count_documents({"salon_id": salon_id, "is_active": True})
        
        # Today's check-ins
        today_checkins = await db.queue.count_documents({
            "salon_id": salon_id,
            "checkin_time": {"$regex": f"^{today}"}
        })
        
        # Current queue length
        current_queue = await db.queue.count_documents({"salon_id": salon_id, "status": "waiting"})
        
        # Total points awarded today
        today_points = 0
        async for transaction in db.points_transactions.find({
            "salon_id": salon_id,
            "transaction_type": "earned",
            "timestamp": {"$regex": f"^{today}"}
        }):
            today_points += transaction["points"]
        
        # Average customer points
        customers_with_points = []
        async for customer in db.customers.find({"salon_id": salon_id, "is_active": True}):
            customers_with_points.append(customer.get("total_points", 0))
        
        avg_customer_points = sum(customers_with_points) / len(customers_with_points) if customers_with_points else 0
        
        return {
            "total_customers": total_customers,
            "today_checkins": today_checkins,
            "current_queue_length": current_queue,
            "today_points_awarded": today_points,
            "average_customer_points": round(avg_customer_points, 1),
            "active_loyalty_members": len([p for p in customers_with_points if p > 0])
        }
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")

@app.get("/api/customers/{customer_id}/points-history")
async def get_customer_points_history(customer_id: str, salon_id: str = Depends(get_current_salon)):
    """Get customer's points transaction history"""
    transactions = []
    async for transaction in db.points_transactions.find({
        "salon_id": salon_id,
        "customer_id": customer_id
    }).sort("timestamp", -1):
        transactions.append(transaction)
    return serialize_document(transactions)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)