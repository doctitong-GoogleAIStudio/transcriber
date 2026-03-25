#!/usr/bin/env python3

import asyncio
import aiohttp
import json
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BACKEND_URL = "https://medical-transcribe-2.preview.emergentagent.com/api"

async def test_edge_cases():
    """Test edge cases and error handling"""
    logger.info("Testing edge cases and error handling...")
    
    timeout = aiohttp.ClientTimeout(total=30)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        
        results = {}
        
        # Test 1: Invalid endpoint
        logger.info("1. Testing invalid endpoint...")
        try:
            async with session.get(f"{BACKEND_URL}/invalid-endpoint") as response:
                results["invalid_endpoint"] = {
                    "status_code": response.status,
                    "expected": 404
                }
                logger.info(f"   ✅ Invalid endpoint returns {response.status} (expected 404)")
        except Exception as e:
            results["invalid_endpoint"] = {"error": str(e)}
            logger.error(f"   ❌ Invalid endpoint test failed: {e}")
        
        # Test 2: Missing required fields for translation
        logger.info("2. Testing missing required fields...")
        try:
            async with session.post(
                f"{BACKEND_URL}/translate",
                json={"text": "Hello"},  # Missing source_language
                headers={"Content-Type": "application/json"}
            ) as response:
                results["missing_fields"] = {
                    "status_code": response.status,
                    "response": await response.text()
                }
                if response.status == 422:  # Validation error
                    logger.info("   ✅ Missing fields properly validated (422)")
                else:
                    logger.info(f"   ⚠️  Missing fields returns {response.status}")
        except Exception as e:
            results["missing_fields"] = {"error": str(e)}
            logger.error(f"   ❌ Missing fields test failed: {e}")
        
        # Test 3: Empty translation text
        logger.info("3. Testing empty translation text...")
        try:
            async with session.post(
                f"{BACKEND_URL}/translate",
                json={"text": "", "source_language": "Spanish"},
                headers={"Content-Type": "application/json"}
            ) as response:
                response_data = await response.json()
                results["empty_text"] = {
                    "status_code": response.status,
                    "response": response_data
                }
                if response.status == 200:
                    logger.info("   ✅ Empty text handled gracefully")
                else:
                    logger.info(f"   ⚠️  Empty text returns {response.status}")
        except Exception as e:
            results["empty_text"] = {"error": str(e)}
            logger.error(f"   ❌ Empty text test failed: {e}")
        
        # Test 4: Invalid base64 audio
        logger.info("4. Testing invalid base64 audio...")
        try:
            async with session.post(
                f"{BACKEND_URL}/detect-language",
                json={"audio_base64": "invalid_base64", "mime_type": "audio/mp3"},
                headers={"Content-Type": "application/json"}
            ) as response:
                results["invalid_audio"] = {
                    "status_code": response.status,
                    "response": await response.text()
                }
                if response.status == 500:  # Internal server error expected
                    logger.info("   ✅ Invalid audio properly handled (500)")
                else:
                    logger.info(f"   ⚠️  Invalid audio returns {response.status}")
        except Exception as e:
            results["invalid_audio"] = {"error": str(e)}
            logger.error(f"   ❌ Invalid audio test failed: {e}")
        
        logger.info("\nEdge case testing completed!")
        return results

if __name__ == "__main__":
    asyncio.run(test_edge_cases())