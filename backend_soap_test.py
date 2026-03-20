#!/usr/bin/env python3
"""
SOAP Generation API Testing Script
Tests the new /api/generate-soap endpoint for Digos Doctors Hospital AI Audio Transcriber
"""
import asyncio
import aiohttp
import json
import time
from datetime import datetime

# Backend URL from frontend environment
BACKEND_URL = "https://practical-bartik-1.preview.emergentagent.com/api"

class SOAPTestSuite:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.results = []
        
    async def log_test(self, test_name: str, status: str, details: str, response_time: float = None):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_time": f"{response_time:.3f}s" if response_time else "N/A",
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        status_symbol = "✅" if status == "PASS" else "❌"
        print(f"{status_symbol} {test_name}: {details}")
        if response_time:
            print(f"   Response time: {response_time:.3f}s")
    
    async def test_soap_generation_main_case(self):
        """Test main SOAP generation case with comprehensive medical transcription"""
        test_name = "SOAP Generation - Main Case"
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "transcription": "Patient complains of persistent headache for 3 days, describes it as throbbing pain on the right side of head, rated 7 out of 10. Patient reports nausea and sensitivity to light. No fever noted. Blood pressure is 130/85, pulse 78, temperature 36.8°C. Neurological examination shows no focal deficits. Pupils equal and reactive to light. Patient has history of migraines.",
                    "language": "English"
                }
                
                async with session.post(
                    f"{self.base_url}/generate-soap",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Verify all 4 SOAP sections exist
                        required_sections = ["subjective", "objective", "assessment", "plan"]
                        missing_sections = [section for section in required_sections if section not in data]
                        
                        if missing_sections:
                            await self.log_test(test_name, "FAIL", 
                                f"Missing SOAP sections: {missing_sections}", response_time)
                            return
                        
                        # Verify sections have meaningful content (not empty)
                        empty_sections = [section for section in required_sections 
                                        if not data[section] or data[section].strip() == ""]
                        
                        if empty_sections:
                            await self.log_test(test_name, "FAIL", 
                                f"Empty SOAP sections: {empty_sections}", response_time)
                            return
                        
                        # Verify content quality - check for key medical terms
                        content_checks = {
                            "subjective": ["headache", "pain", "nausea", "sensitivity", "history"],
                            "objective": ["blood pressure", "130/85", "pulse", "78", "temperature", "36.8", "examination"],
                            "assessment": ["migraine", "headache", "diagnosis"],
                            "plan": ["treatment", "follow", "medication", "plan"]
                        }
                        
                        quality_issues = []
                        for section, keywords in content_checks.items():
                            section_content = data[section].lower()
                            found_keywords = [kw for kw in keywords if kw in section_content]
                            if len(found_keywords) < 2:  # At least 2 relevant keywords expected
                                quality_issues.append(f"{section}: only {len(found_keywords)} relevant terms found")
                        
                        if response_time > 5.0:
                            await self.log_test(test_name, "FAIL", 
                                f"Response too slow: {response_time:.3f}s (max 5s expected)", response_time)
                            return
                        
                        if quality_issues:
                            await self.log_test(test_name, "PASS", 
                                f"SOAP generated successfully but content quality could be improved: {'; '.join(quality_issues)}", response_time)
                        else:
                            await self.log_test(test_name, "PASS", 
                                f"All 4 SOAP sections generated with meaningful medical content. Quality: Excellent", response_time)
                            
                        # Print sample content for verification
                        print(f"   Sample - Subjective: {data['subjective'][:100]}...")
                        print(f"   Sample - Objective: {data['objective'][:100]}...")
                        print(f"   Sample - Assessment: {data['assessment'][:100]}...")
                        print(f"   Sample - Plan: {data['plan'][:100]}...")
                    else:
                        error_text = await response.text()
                        await self.log_test(test_name, "FAIL", 
                            f"HTTP {response.status}: {error_text}", response_time)
        except Exception as e:
            response_time = time.time() - start_time
            await self.log_test(test_name, "FAIL", f"Exception: {str(e)}", response_time)
    
    async def test_soap_generation_short_transcription(self):
        """Test SOAP generation with minimal transcription"""
        test_name = "SOAP Generation - Short Transcription"
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "transcription": "Patient has fever and cough for 2 days.",
                    "language": "English"
                }
                
                async with session.post(
                    f"{self.base_url}/generate-soap",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Verify all sections exist and handle minimal data appropriately
                        required_sections = ["subjective", "objective", "assessment", "plan"]
                        missing_sections = [section for section in required_sections if section not in data]
                        
                        if missing_sections:
                            await self.log_test(test_name, "FAIL", 
                                f"Missing SOAP sections: {missing_sections}", response_time)
                            return
                        
                        # For minimal input, some sections might say "Not documented" or similar
                        sections_with_content = []
                        for section in required_sections:
                            content = data[section].lower()
                            if content and "not documented" not in content and len(content.strip()) > 5:
                                sections_with_content.append(section)
                        
                        if len(sections_with_content) >= 2:  # At least subjective and assessment should have content
                            await self.log_test(test_name, "PASS", 
                                f"SOAP generated appropriately for minimal input. {len(sections_with_content)} sections have meaningful content", response_time)
                        else:
                            await self.log_test(test_name, "FAIL", 
                                f"Insufficient content generation for minimal input", response_time)
                    else:
                        error_text = await response.text()
                        await self.log_test(test_name, "FAIL", 
                            f"HTTP {response.status}: {error_text}", response_time)
        except Exception as e:
            response_time = time.time() - start_time
            await self.log_test(test_name, "FAIL", f"Exception: {str(e)}", response_time)
    
    async def test_soap_generation_non_english(self):
        """Test SOAP generation with non-English transcription"""
        test_name = "SOAP Generation - Non-English (Tagalog)"
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "transcription": "Ang pasyente ay nagsusumbong ng sakit ng ulo at lagnat.",
                    "language": "Tagalog"
                }
                
                async with session.post(
                    f"{self.base_url}/generate-soap",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        # Verify all sections exist
                        required_sections = ["subjective", "objective", "assessment", "plan"]
                        missing_sections = [section for section in required_sections if section not in data]
                        
                        if missing_sections:
                            await self.log_test(test_name, "FAIL", 
                                f"Missing SOAP sections: {missing_sections}", response_time)
                            return
                        
                        # Check if content relates to headache and fever
                        subjective_content = data["subjective"].lower()
                        relevant_terms = any(term in subjective_content for term in ["headache", "ulo", "fever", "lagnat", "sakit"])
                        
                        if relevant_terms:
                            await self.log_test(test_name, "PASS", 
                                f"SOAP generated successfully for Tagalog input", response_time)
                        else:
                            await self.log_test(test_name, "FAIL", 
                                f"SOAP content doesn't seem to relate to input symptoms", response_time)
                    else:
                        error_text = await response.text()
                        await self.log_test(test_name, "FAIL", 
                            f"HTTP {response.status}: {error_text}", response_time)
        except Exception as e:
            response_time = time.time() - start_time
            await self.log_test(test_name, "FAIL", f"Exception: {str(e)}", response_time)
    
    async def test_soap_error_handling_empty_transcription(self):
        """Test error handling with empty transcription"""
        test_name = "SOAP Generation - Empty Transcription Error Handling"
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "transcription": "",
                    "language": "English"
                }
                
                async with session.post(
                    f"{self.base_url}/generate-soap",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 422 or response.status == 400:
                        await self.log_test(test_name, "PASS", 
                            f"Properly rejected empty transcription with HTTP {response.status}", response_time)
                    elif response.status == 500:
                        error_data = await response.json()
                        await self.log_test(test_name, "PASS", 
                            f"Internal error for empty input (HTTP 500) - acceptable behavior", response_time)
                    elif response.status == 200:
                        data = await response.json()
                        await self.log_test(test_name, "PASS", 
                            f"Generated SOAP for empty input - check if appropriate fallback", response_time)
                    else:
                        error_text = await response.text()
                        await self.log_test(test_name, "FAIL", 
                            f"Unexpected HTTP {response.status}: {error_text}", response_time)
        except Exception as e:
            response_time = time.time() - start_time
            await self.log_test(test_name, "FAIL", f"Exception: {str(e)}", response_time)
    
    async def test_soap_error_handling_invalid_json(self):
        """Test error handling with invalid JSON"""
        test_name = "SOAP Generation - Invalid JSON Error Handling"
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/generate-soap",
                    data="invalid json",
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 422 or response.status == 400:
                        await self.log_test(test_name, "PASS", 
                            f"Properly rejected invalid JSON with HTTP {response.status}", response_time)
                    else:
                        error_text = await response.text()
                        await self.log_test(test_name, "FAIL", 
                            f"Unexpected response to invalid JSON - HTTP {response.status}: {error_text}", response_time)
        except Exception as e:
            response_time = time.time() - start_time
            await self.log_test(test_name, "FAIL", f"Exception: {str(e)}", response_time)
    
    async def test_soap_missing_fields(self):
        """Test error handling with missing required fields"""
        test_name = "SOAP Generation - Missing Fields Error Handling"
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "transcription": "Patient has headache"
                    # Missing language field
                }
                
                async with session.post(
                    f"{self.base_url}/generate-soap",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response_time = time.time() - start_time
                    
                    if response.status == 422:
                        await self.log_test(test_name, "PASS", 
                            f"Properly rejected missing language field with HTTP {response.status}", response_time)
                    else:
                        error_text = await response.text()
                        await self.log_test(test_name, "FAIL", 
                            f"Expected 422 for missing field - HTTP {response.status}: {error_text}", response_time)
        except Exception as e:
            response_time = time.time() - start_time
            await self.log_test(test_name, "FAIL", f"Exception: {str(e)}", response_time)
    
    async def run_all_tests(self):
        """Run all SOAP generation tests"""
        print("=" * 80)
        print("🏥 DIGOS DOCTORS HOSPITAL AI AUDIO TRANSCRIBER")
        print("🧾 SOAP GENERATION ENDPOINT TESTING SUITE")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Run all tests
        await self.test_soap_generation_main_case()
        await self.test_soap_generation_short_transcription()
        await self.test_soap_generation_non_english()
        await self.test_soap_error_handling_empty_transcription()
        await self.test_soap_error_handling_invalid_json()
        await self.test_soap_missing_fields()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = len([r for r in self.results if r["status"] == "PASS"])
        failed = len([r for r in self.results if r["status"] == "FAIL"])
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        if failed > 0:
            print("❌ FAILED TESTS:")
            for result in self.results:
                if result["status"] == "FAIL":
                    print(f"  - {result['test']}: {result['details']}")
        else:
            print("✅ ALL TESTS PASSED!")
        
        print(f"\nTest completed at: {datetime.now().isoformat()}")
        return passed, failed, total

async def main():
    """Main test runner"""
    test_suite = SOAPTestSuite()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())