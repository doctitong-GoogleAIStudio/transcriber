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
BACKEND_URL = "https://medical-transcribe-2.preview.emergentagent.com/api"

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
    
    async def test_messenger_contacts_crud(self) -> Dict[str, Any]:
        """Test all CRUD operations for messenger contacts"""
        logger.info("Testing messenger contacts CRUD operations...")
        result = {"endpoint": "messenger-contacts CRUD", "status": "failed", "details": {}, "error": None}
        
        try:
            # Test data for contacts
            test_contacts = [
                {
                    "display_name": "Dr. Juan Dela Cruz",
                    "messenger_username": "juan.delacruz",
                    "facebook_profile_url": "https://facebook.com/juan.delacruz",
                    "mobile_number": "+63 912 345 6789",
                    "is_favorite": True,
                    "preferred_share_format": "pdf"
                },
                {
                    "display_name": "Dr. Maria Santos",
                    "messenger_username": "maria.santos",
                    "facebook_profile_url": "https://facebook.com/maria.santos",
                    "mobile_number": "+63 917 654 3210",
                    "is_favorite": False,
                    "preferred_share_format": "plain_text"
                },
                {
                    "display_name": "Dr. Jose Rizal",
                    "messenger_username": "jose.rizal",
                    "facebook_profile_url": "https://facebook.com/jose.rizal",
                    "mobile_number": "+63 928 111 2222",
                    "is_favorite": True,
                    "preferred_share_format": "pdf"
                }
            ]
            
            created_contacts = []
            
            # 1. Create test contacts
            logger.info("Creating test contacts...")
            for i, contact_data in enumerate(test_contacts):
                async with self.session.post(
                    f"{BACKEND_URL}/messenger-contacts",
                    json=contact_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        contact = await response.json()
                        created_contacts.append(contact)
                        logger.info(f"✅ Created contact {i+1}: {contact['display_name']}")
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to create contact {i+1}: HTTP {response.status} - {error_text}")
            
            result["details"]["create"] = f"Successfully created {len(created_contacts)} contacts"
            
            # 2. Get all contacts
            logger.info("Retrieving all contacts...")
            async with self.session.get(f"{BACKEND_URL}/messenger-contacts") as response:
                if response.status == 200:
                    all_contacts = await response.json()
                    if len(all_contacts) >= len(created_contacts):
                        # Check if favorites are sorted first
                        favorites = [c for c in all_contacts if c.get('is_favorite', False)]
                        non_favorites = [c for c in all_contacts if not c.get('is_favorite', False)]
                        
                        # Verify favorites appear before non-favorites
                        favorites_first = True
                        if len(favorites) > 0 and len(non_favorites) > 0:
                            first_favorite_idx = next((i for i, c in enumerate(all_contacts) if c.get('is_favorite', False)), -1)
                            last_favorite_idx = len([c for c in all_contacts if c.get('is_favorite', False)]) - 1
                            first_non_favorite_idx = next((i for i, c in enumerate(all_contacts) if not c.get('is_favorite', False)), -1)
                            
                            if first_non_favorite_idx != -1 and first_non_favorite_idx < last_favorite_idx:
                                favorites_first = False
                        
                        result["details"]["get_all"] = f"Retrieved {len(all_contacts)} contacts, favorites sorted first: {favorites_first}"
                        logger.info(f"✅ Retrieved all contacts - Total: {len(all_contacts)}, Favorites first: {favorites_first}")
                    else:
                        raise Exception(f"Expected at least {len(created_contacts)} contacts, got {len(all_contacts)}")
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to get all contacts: HTTP {response.status} - {error_text}")
            
            # 3. Update a contact's favorite status
            if created_contacts:
                contact_to_update = created_contacts[0]
                update_data = {
                    "is_favorite": False,
                    "preferred_share_format": "plain_text"
                }
                
                logger.info(f"Updating contact: {contact_to_update['display_name']}")
                async with self.session.put(
                    f"{BACKEND_URL}/messenger-contacts/{contact_to_update['id']}",
                    json=update_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        updated_contact = await response.json()
                        if (updated_contact['is_favorite'] == update_data['is_favorite'] and 
                            updated_contact['preferred_share_format'] == update_data['preferred_share_format']):
                            result["details"]["update"] = "Successfully updated contact"
                            logger.info("✅ Contact updated successfully")
                        else:
                            raise Exception("Contact update validation failed")
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to update contact: HTTP {response.status} - {error_text}")
            
            # 4. Test favorites filter
            logger.info("Testing favorites filter...")
            async with self.session.get(f"{BACKEND_URL}/messenger-contacts?favorites_only=true") as response:
                if response.status == 200:
                    favorites_only = await response.json()
                    all_favorites = all([c.get('is_favorite', False) for c in favorites_only])
                    result["details"]["favorites_filter"] = f"Retrieved {len(favorites_only)} favorites, all are favorites: {all_favorites}"
                    logger.info(f"✅ Favorites filter - Found {len(favorites_only)} favorites")
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to get favorites: HTTP {response.status} - {error_text}")
            
            # 5. Delete one contact
            if created_contacts:
                contact_to_delete = created_contacts[-1]
                logger.info(f"Deleting contact: {contact_to_delete['display_name']}")
                async with self.session.delete(f"{BACKEND_URL}/messenger-contacts/{contact_to_delete['id']}") as response:
                    if response.status == 200:
                        delete_response = await response.json()
                        result["details"]["delete"] = "Successfully deleted contact"
                        logger.info("✅ Contact deleted successfully")
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to delete contact: HTTP {response.status} - {error_text}")
            
            # 6. Verify deletion
            logger.info("Verifying contact deletion...")
            async with self.session.get(f"{BACKEND_URL}/messenger-contacts") as response:
                if response.status == 200:
                    final_contacts = await response.json()
                    if len(final_contacts) == len(created_contacts) - 1:
                        result["details"]["verify_delete"] = "Contact deletion verified"
                        logger.info("✅ Contact deletion verified")
                    else:
                        raise Exception(f"Expected {len(created_contacts) - 1} contacts after deletion, got {len(final_contacts)}")
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to verify deletion: HTTP {response.status} - {error_text}")
            
            result["status"] = "passed"
            logger.info("✅ All messenger contacts CRUD operations passed")
            
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"❌ Messenger contacts CRUD failed: {str(e)}")
            
        return result
    
    async def test_shared_transcriptions_logging(self) -> Dict[str, Any]:
        """Test shared transcriptions logging functionality"""
        logger.info("Testing shared transcriptions logging...")
        result = {"endpoint": "shared-transcriptions", "status": "failed", "details": {}, "error": None}
        
        try:
            # Test data for shared transcriptions
            test_shares = [
                {
                    "transcript_id": "trans_12345",
                    "recipient_name": "Dr. Juan Dela Cruz",
                    "recipient_contact_id": "contact_123",
                    "share_format": "pdf",
                    "share_method": "messenger",
                    "content_options": {
                        "include_original": True,
                        "include_translation": False,
                        "include_soap": True
                    },
                    "status": "completed"
                },
                {
                    "transcript_id": "trans_67890",
                    "recipient_name": "Dr. Maria Santos",
                    "recipient_contact_id": "contact_456",
                    "share_format": "plain_text",
                    "share_method": "copy",
                    "content_options": {
                        "include_original": True,
                        "include_translation": True,
                        "include_soap": False
                    },
                    "status": "completed"
                }
            ]
            
            created_shares = []
            
            # 1. Log shared transcriptions
            logger.info("Logging shared transcriptions...")
            for i, share_data in enumerate(test_shares):
                async with self.session.post(
                    f"{BACKEND_URL}/shared-transcriptions",
                    json=share_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        share = await response.json()
                        created_shares.append(share)
                        logger.info(f"✅ Logged share {i+1}: {share['recipient_name']} via {share['share_method']}")
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to log share {i+1}: HTTP {response.status} - {error_text}")
            
            result["details"]["create"] = f"Successfully logged {len(created_shares)} shared transcriptions"
            
            # 2. Retrieve sharing history
            logger.info("Retrieving sharing history...")
            async with self.session.get(f"{BACKEND_URL}/shared-transcriptions") as response:
                if response.status == 200:
                    sharing_history = await response.json()
                    if len(sharing_history) >= len(created_shares):
                        # Check if sorted by created_at descending (newest first)
                        sorted_correctly = True
                        if len(sharing_history) > 1:
                            for i in range(len(sharing_history) - 1):
                                current_time = sharing_history[i].get('created_at', '')
                                next_time = sharing_history[i + 1].get('created_at', '')
                                if current_time < next_time:
                                    sorted_correctly = False
                                    break
                        
                        result["details"]["get_history"] = f"Retrieved {len(sharing_history)} share logs, sorted correctly: {sorted_correctly}"
                        logger.info(f"✅ Retrieved sharing history - Total: {len(sharing_history)}, Sorted by date: {sorted_correctly}")
                        
                        # Verify all required fields are present
                        required_fields = ['id', 'transcript_id', 'recipient_name', 'share_format', 'share_method', 'content_options', 'status', 'created_at']
                        all_fields_present = True
                        for share in sharing_history:
                            for field in required_fields:
                                if field not in share:
                                    all_fields_present = False
                                    break
                            if not all_fields_present:
                                break
                        
                        result["details"]["field_validation"] = f"All required fields present: {all_fields_present}"
                        logger.info(f"✅ Field validation - All required fields present: {all_fields_present}")
                        
                    else:
                        raise Exception(f"Expected at least {len(created_shares)} share logs, got {len(sharing_history)}")
                else:
                    error_text = await response.text()
                    raise Exception(f"Failed to get sharing history: HTTP {response.status} - {error_text}")
            
            result["status"] = "passed"
            logger.info("✅ All shared transcriptions logging operations passed")
            
        except Exception as e:
            result["error"] = str(e)
            logger.error(f"❌ Shared transcriptions logging failed: {str(e)}")
            
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
        
        logger.info("\n5. Testing NEW SHARING FEATURES...")
        logger.info("=" * 40)
        
        logger.info("\n6. Testing Messenger Contacts CRUD Operations...")
        test_results["messenger_contacts_crud"] = await self.test_messenger_contacts_crud()
        
        logger.info("\n7. Testing Shared Transcriptions Logging...")
        test_results["shared_transcriptions_logging"] = await self.test_shared_transcriptions_logging()
        
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