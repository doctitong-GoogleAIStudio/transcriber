"""
Backend API Tests for DDH Transcriber - New Features
Tests for generate-summary and generate-insights endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNewFeatures:
    """Tests for new summary and insights generation endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testuser",
            "password": "test123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        self.test_transcription = "This is a test meeting. We discussed the project timeline and decided to launch next month. John will handle the marketing and Sarah will manage development."
        self.medical_transcription = "Patient reports headache for 3 days. Blood pressure is 120/80. Diagnosis: tension headache. Plan: rest and ibuprofen."
    
    # ============ Generate Summary Tests ============
    
    def test_generate_summary_success(self):
        """Test POST /api/generate-summary returns a summary"""
        response = self.session.post(f"{BASE_URL}/api/generate-summary", json={
            "transcription": self.test_transcription,
            "language": "English"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "summary" in data, "Response should contain 'summary' field"
        assert isinstance(data["summary"], str), "Summary should be a string"
        assert len(data["summary"]) > 0, "Summary should not be empty"
        print(f"Summary generated: {data['summary'][:100]}...")
    
    def test_generate_summary_empty_transcription(self):
        """Test generate-summary with empty transcription"""
        response = self.session.post(f"{BASE_URL}/api/generate-summary", json={
            "transcription": "",
            "language": "English"
        })
        # Should either return 400 or handle gracefully
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
    
    # ============ Generate Insights Tests ============
    
    def test_generate_insights_general_mode(self):
        """Test POST /api/generate-insights with general mode"""
        response = self.session.post(f"{BASE_URL}/api/generate-insights", json={
            "transcription": self.test_transcription,
            "language": "English",
            "mode": "general"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "sections" in data, "Response should contain 'sections' field"
        assert "mode" in data, "Response should contain 'mode' field"
        assert data["mode"] == "general", f"Mode should be 'general', got {data['mode']}"
        assert isinstance(data["sections"], dict), "Sections should be a dictionary"
        print(f"General insights sections: {list(data['sections'].keys())}")
    
    def test_generate_insights_meeting_mode(self):
        """Test POST /api/generate-insights with meeting mode"""
        response = self.session.post(f"{BASE_URL}/api/generate-insights", json={
            "transcription": self.test_transcription,
            "language": "English",
            "mode": "meeting"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "sections" in data
        assert data["mode"] == "meeting"
        # Meeting mode should have specific sections
        sections = data["sections"]
        print(f"Meeting insights sections: {list(sections.keys())}")
    
    def test_generate_insights_medical_mode(self):
        """Test POST /api/generate-insights with medical mode"""
        response = self.session.post(f"{BASE_URL}/api/generate-insights", json={
            "transcription": self.medical_transcription,
            "language": "English",
            "mode": "medical"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "sections" in data
        assert data["mode"] == "medical"
        sections = data["sections"]
        # Medical mode should have SOAP-like sections
        print(f"Medical insights sections: {list(sections.keys())}")
    
    def test_generate_insights_lecture_mode(self):
        """Test POST /api/generate-insights with lecture mode"""
        lecture_transcription = "Today we will learn about photosynthesis. Photosynthesis is the process by which plants convert sunlight into energy. The key components are chlorophyll, water, and carbon dioxide."
        response = self.session.post(f"{BASE_URL}/api/generate-insights", json={
            "transcription": lecture_transcription,
            "language": "English",
            "mode": "lecture"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["mode"] == "lecture"
        print(f"Lecture insights sections: {list(data['sections'].keys())}")
    
    def test_generate_insights_interview_mode(self):
        """Test POST /api/generate-insights with interview mode"""
        interview_transcription = "Interviewer: Tell me about yourself. Candidate: I have 5 years of experience in software development. Interviewer: What are your strengths? Candidate: I am a quick learner and team player."
        response = self.session.post(f"{BASE_URL}/api/generate-insights", json={
            "transcription": interview_transcription,
            "language": "English",
            "mode": "interview"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["mode"] == "interview"
        print(f"Interview insights sections: {list(data['sections'].keys())}")
    
    def test_generate_insights_default_mode(self):
        """Test POST /api/generate-insights defaults to general mode"""
        response = self.session.post(f"{BASE_URL}/api/generate-insights", json={
            "transcription": self.test_transcription,
            "language": "English"
            # mode not specified - should default to general
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["mode"] == "general", "Default mode should be 'general'"


class TestAuthEndpoints:
    """Verify auth endpoints still work after UI overhaul"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testuser",
            "password": "test123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["username"] == "testuser"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testuser",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
    
    def test_get_current_user(self):
        """Test GET /api/auth/me with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testuser",
            "password": "test123"
        })
        token = login_response.json()["token"]
        
        # Get current user
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"


class TestHistoryEndpoints:
    """Verify history endpoints still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "testuser",
            "password": "test123"
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_get_history(self):
        """Test GET /api/history/ returns list"""
        response = self.session.get(f"{BASE_URL}/api/history/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} history items")
    
    def test_create_and_get_history_item(self):
        """Test creating and retrieving a history item"""
        # Create
        create_response = self.session.post(f"{BASE_URL}/api/history/", json={
            "file_name": "TEST_new_feature_test.mp3",
            "language": "English",
            "transcription": "Test transcription for new features",
            "date": "2026-01-22 10:00:00"
        })
        
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        created = create_response.json()
        assert "id" in created
        
        # Verify in list
        list_response = self.session.get(f"{BASE_URL}/api/history/")
        assert list_response.status_code == 200
        items = list_response.json()
        found = any(item.get("id") == created["id"] for item in items)
        assert found, "Created item should appear in history list"
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/history/{created['id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
