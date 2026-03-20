#!/usr/bin/env python3
"""
Detailed SOAP Content Quality Verification
"""
import asyncio
import aiohttp
import json

BACKEND_URL = "https://practical-bartik-1.preview.emergentagent.com/api"

async def detailed_soap_verification():
    """Detailed verification of SOAP content quality"""
    print("🔍 DETAILED SOAP CONTENT QUALITY VERIFICATION")
    print("=" * 60)
    
    test_cases = [
        {
            "name": "Complex Medical Case",
            "transcription": "Patient complains of persistent headache for 3 days, describes it as throbbing pain on the right side of head, rated 7 out of 10. Patient reports nausea and sensitivity to light. No fever noted. Blood pressure is 130/85, pulse 78, temperature 36.8°C. Neurological examination shows no focal deficits. Pupils equal and reactive to light. Patient has history of migraines.",
            "language": "English"
        },
        {
            "name": "Multi-symptom Case",
            "transcription": "65-year-old male presents with chest pain, shortness of breath, and fatigue for 2 weeks. Pain is substernal, 6/10 intensity, radiates to left arm. Vitals: BP 160/90, HR 95, RR 20, O2 sat 94% on room air. Heart sounds reveal S4 gallop. EKG shows ST depression in leads V4-V6. Patient is diabetic on metformin.",
            "language": "English"
        }
    ]
    
    async with aiohttp.ClientSession() as session:
        for i, case in enumerate(test_cases, 1):
            print(f"\n📋 Test Case {i}: {case['name']}")
            print("-" * 50)
            
            try:
                async with session.post(
                    f"{BACKEND_URL}/generate-soap",
                    json=case,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 200:
                        data = await response.json()
                        
                        print("✅ SOAP Generation Successful")
                        print("\n📝 GENERATED SOAP NOTE:")
                        print("=" * 30)
                        
                        sections = [
                            ("SUBJECTIVE", data.get("subjective", "")),
                            ("OBJECTIVE", data.get("objective", "")),
                            ("ASSESSMENT", data.get("assessment", "")),
                            ("PLAN", data.get("plan", ""))
                        ]
                        
                        for section_name, content in sections:
                            print(f"\n🔸 {section_name}:")
                            if content.strip():
                                print(f"   {content}")
                                print(f"   📊 Length: {len(content)} characters")
                            else:
                                print("   ⚠️  No content generated")
                        
                        # Content Quality Analysis
                        print(f"\n📊 QUALITY ANALYSIS:")
                        print(f"   • All sections present: {'✅' if all(data.get(s) for s in ['subjective', 'objective', 'assessment', 'plan']) else '❌'}")
                        print(f"   • Average section length: {sum(len(data.get(s, '')) for s in ['subjective', 'objective', 'assessment', 'plan'])/4:.0f} chars")
                        
                        # Check for medical relevance
                        medical_terms_found = []
                        all_content = ' '.join([data.get(s, '').lower() for s in ['subjective', 'objective', 'assessment', 'plan']])
                        
                        if "headache" in case["transcription"].lower():
                            medical_terms = ["headache", "migraine", "pain", "neurological", "examination"]
                        else:
                            medical_terms = ["chest pain", "cardiac", "heart", "ekg", "ecg", "diabetic"]
                        
                        for term in medical_terms:
                            if term in all_content:
                                medical_terms_found.append(term)
                        
                        print(f"   • Medical relevance: {len(medical_terms_found)}/{len(medical_terms)} key terms found")
                        print(f"   • Found terms: {', '.join(medical_terms_found)}")
                    
                    else:
                        print(f"❌ HTTP {response.status}: {await response.text()}")
                        
            except Exception as e:
                print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    asyncio.run(detailed_soap_verification())