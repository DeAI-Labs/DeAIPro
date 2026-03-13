#!/usr/bin/env python3
"""
MongoDB Connection Debugging Script
Helps identify connection issues and test the database setup.
"""

import asyncio
import os
import sys
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def debug_connection():
    """Test MongoDB connection with detailed diagnostics."""
    
    print("=" * 80)
    print("MongoDB Connection Debugger")
    print("=" * 80)
    
    # 1. Check environment variables
    print("\n1. Environment Variables Check:")
    print("-" * 40)
    
    database_url = os.getenv("DATABASE_URL")
    mongodb_uri = os.getenv("MONGODB_URI")
    mongodb_user = os.getenv("MONGODB_USER", "root")
    mongodb_password = os.getenv("MONGODB_PASSWORD", "password")
    mongodb_port = os.getenv("MONGODB_PORT", "27017")
    
    print(f"DATABASE_URL: {database_url if database_url else '❌ NOT SET'}")
    print(f"MONGODB_URI: {mongodb_uri if mongodb_uri else '❌ NOT SET'}")
    print(f"MONGODB_USER: {mongodb_user}")
    print(f"MONGODB_PASSWORD: {'*' * len(mongodb_password) if mongodb_password else '❌ NOT SET'}")
    print(f"MONGODB_PORT: {mongodb_port}")
    
    # 2. Load settings
    print("\n2. Settings Load Check:")
    print("-" * 40)
    
    try:
        from config.settings import settings
        print(f"✓ Settings loaded successfully")
        print(f"  Database URL (from settings): {settings.database_url}")
        print(f"  Environment: {settings.environment}")
        print(f"  Debug: {settings.debug}")
    except Exception as e:
        print(f"❌ Failed to load settings: {e}")
        return
    
    # 3. Check MongoDB driver
    print("\n3. MongoDB Driver Check:")
    print("-" * 40)
    
    try:
        import pymongo
        print(f"✓ PyMongo version: {pymongo.__version__}")
    except Exception as e:
        print(f"❌ PyMongo not installed: {e}")
        return
    
    try:
        import motor
        print(f"✓ Motor version: {motor.__version__}")
    except Exception as e:
        print(f"❌ Motor not installed: {e}")
        return
    
    try:
        import beanie
        print(f"✓ Beanie version: {beanie.__version__}")
    except Exception as e:
        print(f"❌ Beanie not installed: {e}")
        return
    
    # 4. Test basic connection with PyMongo
    print("\n4. Basic PyMongo Connection Test:")
    print("-" * 40)
    
    try:
        from pymongo import MongoClient
        client = MongoClient(settings.database_url, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
        # Try to access admin database to test auth
        client.admin.command('ismaster')
        print(f"✓ PyMongo connection successful!")
        client.close()
    except Exception as e:
        print(f"❌ PyMongo connection failed: {e}")
        print(f"   Connection string: {settings.database_url}")
    
    # 5. Test async connection with Motor
    print("\n5. Motor Async Connection Test:")
    print("-" * 40)
    
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(settings.database_url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ismaster')
        print(f"✓ Motor async connection successful!")
        client.close()
    except Exception as e:
        print(f"❌ Motor async connection failed: {e}")
        print(f"   Connection string: {settings.database_url}")
    
    # 6. Test full Database class initialization
    print("\n6. Full Beanie Initialization Test:")
    print("-" * 40)
    
    try:
        from dependencies.db import db
        await db.connect()
        print(f"✓ Database.connect() successful!")
        await db.disconnect()
    except Exception as e:
        print(f"❌ Database.connect() failed: {e}")
        import traceback
        traceback.print_exc()
    
    # 7. Check if MongoDB is running
    print("\n7. MongoDB Service Status:")
    print("-" * 40)
    
    try:
        import socket
        # Extract host and port from connection string
        # Format: mongodb://user:pass@host:port/db
        parts = settings.database_url.replace("mongodb://", "").split("@")
        if len(parts) == 2:
            host_part = parts[1].split("/")[0]
            host, port = host_part.rsplit(":", 1)
            port = int(port)
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex((host, port))
            sock.close()
            
            if result == 0:
                print(f"✓ MongoDB is reachable at {host}:{port}")
            else:
                print(f"❌ MongoDB is NOT reachable at {host}:{port}")
        else:
            print(f"⚠️  Could not parse connection string for host/port check")
    except Exception as e:
        print(f"⚠️  Host/port check failed: {e}")
    
    print("\n" + "=" * 80)
    print("Diagnostic Complete")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(debug_connection())
