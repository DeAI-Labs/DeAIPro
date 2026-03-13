"""Database seeding script for initial data population."""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dependencies.db import db
from models import (
    Subnet,
    SubnetNews,
    SyncState,
    ResearchArticle,
    Lesson,
)


async def seed_subnets():
    """Seed initial subnet data."""
    print("📊 Seeding subnets...")
    
    subnets_data = [
        {
            "id": 1,
            "name": "Tensor",
            "category": "Infrastructure",
            "icon": "🏗️",
            "market_cap_millions": 1240.5,
            "daily_emission": 1850.0,
            "total_stake": 14_250_000.0,
            "apy": 12.4,
            "validators_count": 128,
            "miners_count": 2048,
            "registration_count": 4096,
            "github_url": "https://github.com/opentensor/bittensor",
            "github_commits_30d": 156,
            "github_stars": 4200,
            "test_coverage": 78.5,
            "trend": "up",
            "momentum_score": 82.0,
            "quality_score": 88.5,
        },
        {
            "id": 2,
            "name": "BitLocals",
            "category": "Finance",
            "icon": "💱",
            "market_cap_millions": 450.2,
            "daily_emission": 720.0,
            "total_stake": 5_120_000.0,
            "apy": 18.3,
            "validators_count": 64,
            "miners_count": 1024,
            "registration_count": 2048,
            "github_url": "https://github.com/bitlocals/subnet",
            "github_commits_30d": 42,
            "github_stars": 892,
            "test_coverage": 65.0,
            "trend": "stable",
            "momentum_score": 65.0,
            "quality_score": 72.0,
        },
        {
            "id": 3,
            "name": "Filet",
            "category": "AI/ML",
            "icon": "🧠",
            "market_cap_millions": 380.1,
            "daily_emission": 580.0,
            "total_stake": 4_200_000.0,
            "apy": 22.1,
            "validators_count": 96,
            "miners_count": 1536,
            "registration_count": 3072,
            "github_url": "https://github.com/filet/subnet",
            "github_commits_30d": 89,
            "github_stars": 1250,
            "test_coverage": 71.5,
            "trend": "up",
            "momentum_score": 75.5,
            "quality_score": 80.0,
        },
        {
            "id": 4,
            "name": "Omega",
            "category": "Compute",
            "icon": "⚙️",
            "market_cap_millions": 520.8,
            "daily_emission": 920.0,
            "total_stake": 7_100_000.0,
            "apy": 15.6,
            "validators_count": 112,
            "miners_count": 1792,
            "registration_count": 3584,
            "github_url": "https://github.com/omega/subnet",
            "github_commits_30d": 67,
            "github_stars": 1580,
            "test_coverage": 73.0,
            "trend": "down",
            "momentum_score": 58.0,
            "quality_score": 75.5,
        },
    ]
    
    for data in subnets_data:
        existing = await Subnet.find_one(Subnet.id == data["id"])
        if not existing:
            subnet = Subnet(**data)
            await subnet.insert()
            print(f"  ✓ Created subnet: {data['name']} (ID: {data['id']})")
        else:
            print(f"  ℹ Subnet {data['name']} already exists")
    
    print(f"✓ Subnets seeding complete ({len(subnets_data)} total)\n")


async def seed_news():
    """Seed sample news articles."""
    print("📰 Seeding news articles...")
    
    news_data = [
        {
            "title": "Bittensor Network Reaches 58 Subnets Milestone",
            "url": "https://example.com/news/58-subnets",
            "source": "TAO Daily",
            "category": "ecosystem",
            "content_excerpt": "The Bittensor network has officially reached 58 active subnets, marking significant growth in the ecosystem.",
            "image_url": "https://example.com/images/milestone.jpg",
            "relevance_score": 0.95,
            "subnet_id": None,
            "published_at": datetime.utcnow() - timedelta(hours=2),
        },
        {
            "title": "New Validator Requirements on Tensor Subnet",
            "url": "https://example.com/news/validator-req",
            "source": "GitHub",
            "category": "technical",
            "content_excerpt": "Tensor subnet updates validator requirements to improve network quality.",
            "image_url": None,
            "relevance_score": 0.87,
            "subnet_id": 1,
            "published_at": datetime.utcnow() - timedelta(hours=6),
        },
        {
            "title": "TAO Token Analysis: Q1 2026 Performance",
            "url": "https://example.com/news/tao-analysis",
            "source": "Research",
            "category": "market-analysis",
            "content_excerpt": "Comprehensive analysis of TAO token performance and market trends in Q1 2026.",
            "image_url": "https://example.com/images/tao-chart.jpg",
            "relevance_score": 0.92,
            "subnet_id": None,
            "published_at": datetime.utcnow() - timedelta(hours=12),
        },
    ]
    
    for data in news_data:
        existing = await SubnetNews.find_one(SubnetNews.title == data["title"])
        if not existing:
            news = SubnetNews(**data)
            await news.insert()
            print(f"  ✓ Created article: {data['title'][:50]}...")
        else:
            print(f"  ℹ Article '{data['title'][:30]}...' already exists")
    
    print(f"✓ News seeding complete ({len(news_data)} total)\n")


async def seed_research():
    """Seed research articles."""
    print("📚 Seeding research articles...")
    
    research_data = [
        {
            "title": "Understanding Subnet Economics",
            "category": "economics",
            "icon": "💰",
            "excerpt": "A deep dive into how subnet economics work and what drives validator profits.",
            "content": """
# Understanding Subnet Economics

## Introduction
Subnet economics determine the profitability and sustainability of Bittensor subnets...

## Daily Emission
Each subnet receives a daily emission of TAO tokens...

## Validator Rewards
Validators earn TAO proportional to their stake and the quality of their work...

## Key Metrics
- APY (Annual Percentage Yield)
- Market Cap in USD
- Total Staked TAO
- Active Validators
            """,
            "author": "Dr. AI Analytics",
            "tags": ["economics", "validators", "rewards", "staking"],
            "published_date": datetime.utcnow() - timedelta(days=5),
        },
        {
            "title": "Getting Started with Bittensor Mining",
            "category": "beginner-guide",
            "icon": "🚀",
            "excerpt": "Step-by-step guide to setting up your first Bittensor miner.",
            "content": """
# Getting Started with Bittensor Mining

## Prerequisites
- GPU (NVIDIA recommended)
- Python 3.8+
- 8GB+ RAM

## Installation
1. Clone bittensor repository
2. Install dependencies
3. Register your miner

## Running Your Miner
Start mining with optimal configuration settings...
            """,
            "author": "Community Hub",
            "tags": ["mining", "getting-started", "tutorial", "technical"],
            "published_date": datetime.utcnow() - timedelta(days=10),
        },
    ]
    
    for data in research_data:
        existing = await ResearchArticle.find_one(ResearchArticle.title == data["title"])
        if not existing:
            article = ResearchArticle(**data)
            await article.insert()
            print(f"  ✓ Created research: {data['title']}")
        else:
            print(f"  ℹ Research '{data['title']}' already exists")
    
    print(f"✓ Research seeding complete ({len(research_data)} total)\n")


async def seed_lessons():
    """Seed educational lessons."""
    print("📖 Seeding lessons...")
    
    lessons_data = [
        {
            "title": "What is Bittensor?",
            "category": "fundamentals",
            "level": "beginner",
            "duration_minutes": 15,
            "content": """
# What is Bittensor?

Bittensor is a decentralized machine learning network...

## Key Features
- Decentralized AI training
- Token incentivized participation
- Subnet-based specialization

## The TAO Token
TAO is the native token of the Bittensor network...
            """,
            "key_takeaways": [
                "Bittensor is a decentralized AI network",
                "TAO tokens incentivize participation",
                "Subnets specialize in different AI tasks",
                "Validators and miners drive the network",
            ],
            "resources": [
                {"title": "Official Docs", "url": "https://docs.bittensor.com", "type": "documentation"},
                {"title": "YouTube Intro", "url": "https://youtube.com/bittensor", "type": "video"},
            ],
        },
        {
            "title": "Validator Operations",
            "category": "advanced",
            "level": "intermediate",
            "duration_minutes": 45,
            "content": """
# Running a Bittensor Validator

## Validator Role
Validators score the output of miners and maintain network quality...

## Hardware Requirements
- GPU recommended (not required)
- 8GB+ RAM
- Reliable internet

## Configuration
Set up your validator with optimal parameters...
            """,
            "key_takeaways": [
                "Validators rank miner outputs",
                "Validators earn TAO from emissions",
                "Active participation is required",
                "Network quality depends on validators",
            ],
            "resources": [
                {"title": "Validator Setup Guide", "url": "https://docs.bittensor.com/validators", "type": "guide"},
            ],
        },
    ]
    
    for data in lessons_data:
        existing = await Lesson.find_one(Lesson.title == data["title"])
        if not existing:
            lesson = Lesson(**data)
            await lesson.insert()
            print(f"  ✓ Created lesson: {data['title']}")
        else:
            print(f"  ℹ Lesson '{data['title']}' already exists")
    
    print(f"✓ Lessons seeding complete ({len(lessons_data)} total)\n")


async def seed_sync_state():
    """Initialize sync state for background workers."""
    print("🔄 Seeding sync state...")
    
    services = ["metagraph", "github_commits", "price", "research_news"]
    
    for service in services:
        existing = await SyncState.find_one(SyncState.service == service)
        if not existing:
            sync = SyncState(
                service=service,
                status="pending",
                last_run=None,
                last_completed=None,
                next_scheduled=datetime.utcnow() + timedelta(minutes=5),
            )
            await sync.insert()
            print(f"  ✓ Created sync state for: {service}")
        else:
            print(f"  ℹ Sync state for '{service}' already exists")
    
    print(f"✓ Sync state seeding complete ({len(services)} total)\n")


async def main():
    """Run all seeding tasks."""
    print("\n" + "="*60)
    print("🌱 DeAIPro Database Seeding")
    print("="*60 + "\n")
    
    try:
        # Connect to database
        print("📡 Connecting to MongoDB...")
        await db.connect()
        print("✓ Connected to MongoDB\n")
        
        # Seed collections
        await seed_subnets()
        await seed_news()
        await seed_research()
        await seed_lessons()
        await seed_sync_state()
        
        print("="*60)
        print("✅ Seeding complete!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        raise
    finally:
        # Disconnect
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
