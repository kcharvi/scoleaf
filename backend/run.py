#!/usr/bin/env python3
"""
Scoleaf Backend Runner

Simple script to start the FastAPI backend server.
"""

import os
import sys
from pathlib import Path

# Add app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    
    print("🚀 Starting Scoleaf Backend...")
    print(f"📍 Server: http://{settings.host}:{settings.port}")
    print(f"📚 API Docs: http://{settings.host}:{settings.port}/docs")
    print(f"🔧 Debug Mode: {settings.debug}")
    
    # Set environment variable for Google API key if not set
    if not os.getenv("GOOGLE_API_KEY"):
        print("\n⚠️  GOOGLE_API_KEY not found in environment!")
        print("   Set it with: export GOOGLE_API_KEY='your-api-key-here'")
        print("   Or create a .env file in the backend directory with:")
        print("   GOOGLE_API_KEY=your-api-key-here")
        print("")
    
    try:
        uvicorn.run(
            "app.main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level="debug" if settings.debug else "info",
            reload_dirs=["app"] if settings.debug else None,
            reload_excludes=["*/uploads/*"] if settings.debug else None
        )
    except KeyboardInterrupt:
        print("\n👋 Backend stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting backend: {e}")
        sys.exit(1) 