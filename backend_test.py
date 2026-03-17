#!/usr/bin/env python3

import asyncio
import aiohttp
import json
import base64
import time
from pathlib import Path
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Backend URL from environment
BACKEND_URL = "https://practical-bartik-1.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.results = {}
        
    async def __aenter__(self):
        timeout = aiohttp.ClientTimeout(total=120)  # 2 minutes timeout for AI processing
        self.session = aiohttp.ClientSession(timeout=timeout)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def create_mock_audio_base64(self) -> str:
        """Create a small mock audio file in base64 format for testing"""
        # This is a minimal WAV file header + silence (44 byte WAV header + some audio data)
        # WAV header for 16-bit mono PCM, 16kHz sample rate, ~1 second of silence
        wav_header = bytes([
            0x52, 0x49, 0x46, 0x46,  # "RIFF"
            0x48, 0x00, 0x00, 0x00,  # File size (72 bytes)
            0x57, 0x41, 0x56, 0x45,  # "WAVE" 
            0x66, 0x6d, 0x74, 0x20,  # "fmt "
            0x10, 0x00, 0x00, 0x00,  # PCM header length (16)
            0x01, 0x00,              # Audio format (1 = PCM)
            0x01, 0x00,              # Number of channels (1)
            0x80, 0x3E, 0x00, 0x00,  # Sample rate (16000)
            0x00, 0x7D, 0x00, 0x00,  # Byte rate (32000)
            0x02, 0x00,              # Block align (2)
            0x10, 0x00,              # Bits per sample (16)
            0x64, 0x61, 0x74, 0x61,  # "data"
            0x28, 0x00, 0x00, 0x00,  # Data size (40 bytes)
        ])
        # Add some silence (zeros) for ~40 bytes of audio data
        silence = bytes([0x00] * 40)
        wav_data = wav_header + silence
        
        return base64.b64encode(wav_data).decode('utf-8')
    
    async def test_health_check(self) -> Dict[str, Any]:
        """Test the GET /api/ health check endpoint"""
        logger.info("Testing health check endpoint...")
        result = {"endpoint": "/api/", "status": "failed", "response": None, "error": None, "response_time": 0}
        
        try:
            start_time = time.time()
            async with self.session.get(f"{BACKEND_URL}/") as response:
                response_time = time.time() - start_time
                result["response_time"] = round(response_time, 3)
                
                if response.status == 200:
                    response_data = await response.json()
                    result["response"] = response_data
                    
                    # Check if response matches expected format
                    if response_data.get("message") == "Hello World":
                        result["status"] = "passed"
                        logger.info("✅ Health check passed")
                    else:
                        result["status"] = "failed"
                        result["error"] = f"Unexpected response format: {response_data}"
                        logger.error(f"❌ Health check failed: Unexpected response")
                else:
                    result["error"] = f"HTTP {response.status}: {await response.text()}"
                    logger.error(f"❌ Health check failed with status {response.status}")
                    
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"❌ Health check exception: {str(e)}")
            
        return result
    
    async def test_translate_endpoint(self) -> Dict[str, Any]:
        """Test the POST /api/translate endpoint"""
        logger.info("Testing translation endpoint...")
        result = {"endpoint": "/api/translate", "status": "failed", "response": None, "error": None, "response_time": 0}
        
        test_data = {
            "text": "Hola, ¿cómo estás?",
            "source_language": "Spanish"
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{BACKEND_URL}/translate",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_time = time.time() - start_time
                result["response_time"] = round(response_time, 3)
                
                if response.status == 200:
                    response_data = await response.json()
                    result["response"] = response_data
                    
                    # Check if response has the expected structure
                    if "translated_text" in response_data and response_data["translated_text"]:
                        result["status"] = "passed"
                        logger.info(f"✅ Translation passed: '{test_data['text']}' → '{response_data['translated_text']}'")
                    else:
                        result["status"] = "failed"
                        result["error"] = "Response missing 'translated_text' field"
                        logger.error("❌ Translation failed: Missing translated_text field")
                else:
                    error_text = await response.text()
                    result["error"] = f"HTTP {response.status}: {error_text}"
                    logger.error(f"❌ Translation failed with status {response.status}: {error_text}")
                    
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"❌ Translation exception: {str(e)}")
            
        return result
    
    async def test_detect_language_endpoint(self) -> Dict[str, Any]:
        """Test the POST /api/detect-language endpoint"""
        logger.info("Testing language detection endpoint...")
        result = {"endpoint": "/api/detect-language", "status": "failed", "response": None, "error": None, "response_time": 0}
        
        # Use mock audio data for testing
        mock_audio = self.create_mock_audio_base64()
        test_data = {
            "audio_base64": mock_audio,
            "mime_type": "audio/wav"
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{BACKEND_URL}/detect-language",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_time = time.time() - start_time
                result["response_time"] = round(response_time, 3)
                
                if response.status == 200:
                    response_data = await response.json()
                    result["response"] = response_data
                    
                    # Check if response has the expected structure
                    if "language" in response_data and response_data["language"]:
                        result["status"] = "passed"
                        logger.info(f"✅ Language detection passed: Detected language '{response_data['language']}'")
                    else:
                        result["status"] = "failed"
                        result["error"] = "Response missing 'language' field"
                        logger.error("❌ Language detection failed: Missing language field")
                else:
                    error_text = await response.text()
                    result["error"] = f"HTTP {response.status}: {error_text}"
                    logger.error(f"❌ Language detection failed with status {response.status}: {error_text}")
                    
        except asyncio.TimeoutError:
            result["error"] = "Request timeout (>120s) - AI processing took too long"
            logger.error("❌ Language detection timeout")
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"❌ Language detection exception: {str(e)}")
            
        return result
    
    async def test_transcribe_endpoint(self) -> Dict[str, Any]:
        """Test the POST /api/transcribe endpoint"""
        logger.info("Testing transcription endpoint...")
        result = {"endpoint": "/api/transcribe", "status": "failed", "response": None, "error": None, "response_time": 0}
        
        # Use mock audio data for testing
        mock_audio = self.create_mock_audio_base64()
        test_data = {
            "audio_base64": mock_audio,
            "mime_type": "audio/wav",
            "language": "English"
        }
        
        try:
            start_time = time.time()
            async with self.session.post(
                f"{BACKEND_URL}/transcribe",
                json=test_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_time = time.time() - start_time
                result["response_time"] = round(response_time, 3)
                
                if response.status == 200:
                    response_data = await response.json()
                    result["response"] = response_data
                    
                    # Check if response has the expected structure
                    if "transcription" in response_data:
                        result["status"] = "passed"
                        logger.info(f"✅ Transcription passed: '{response_data['transcription']}'")
                    else:
                        result["status"] = "failed"
                        result["error"] = "Response missing 'transcription' field"
                        logger.error("❌ Transcription failed: Missing transcription field")
                else:
                    error_text = await response.text()
                    result["error"] = f"HTTP {response.status}: {error_text}"
                    logger.error(f"❌ Transcription failed with status {response.status}: {error_text}")
                    
        except asyncio.TimeoutError:
            result["error"] = "Request timeout (>120s) - AI processing took too long"
            logger.error("❌ Transcription timeout")
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"❌ Transcription exception: {str(e)}")
            
        return result
    
    async def run_all_tests(self) -> Dict[str, Dict[str, Any]]:
        """Run all API endpoint tests in the recommended priority order"""
        logger.info("=" * 60)
        logger.info("Starting AI Audio Transcriber Backend API Tests")
        logger.info("=" * 60)
        
        test_results = {}
        
        # Test in priority order as specified in requirements
        logger.info("\n1. Testing Health Check Endpoint...")
        test_results["health_check"] = await self.test_health_check()
        
        logger.info("\n2. Testing Translation Endpoint...")
        test_results["translation"] = await self.test_translate_endpoint()
        
        logger.info("\n3. Testing Language Detection Endpoint...")
        test_results["language_detection"] = await self.test_detect_language_endpoint()
        
        logger.info("\n4. Testing Transcription Endpoint...")
        test_results["transcription"] = await self.test_transcribe_endpoint()
        
        return test_results

async def main():
    """Main test runner"""
    async with BackendTester() as tester:
        results = await tester.run_all_tests()
        
        # Print summary
        logger.info("\n" + "=" * 60)
        logger.info("TEST SUMMARY")
        logger.info("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in results.items():
            status_icon = "✅" if result["status"] == "passed" else "❌"
            logger.info(f"{status_icon} {test_name.replace('_', ' ').title()}: {result['status'].upper()}")
            if result["status"] == "passed":
                passed += 1
            else:
                failed += 1
                logger.info(f"   Error: {result.get('error', 'Unknown error')}")
            logger.info(f"   Response Time: {result['response_time']}s")
        
        logger.info(f"\nTotal: {passed} passed, {failed} failed")
        
        # Return results for further processing
        return results

if __name__ == "__main__":
    asyncio.run(main())