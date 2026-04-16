"""
Backend API Tests for Authentication System
Tests: Register, Login, Get Current User, Forgot Password, Reset Password, History CRUD
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USERNAME = f"TEST_user_{uuid.uuid4().hex[:8]}"
TEST_PASSWORD = "testpass123"
TEST_FULLNAME = "Test User"

# Existing test user from seed data
EXISTING_USERNAME = "testuser"
EXISTING_PASSWORD = "test123"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API root response: {data}")


class TestUserRegistration:
    """User registration endpoint tests"""
    
    def test_register_new_user(self):
        """Test successful user registration"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
            "full_name": TEST_FULLNAME
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["username"] == TEST_USERNAME.lower()
        assert data["user"]["full_name"] == TEST_FULLNAME
        assert "id" in data["user"]
        assert "created_at" in data["user"]
        
        print(f"Successfully registered user: {data['user']['username']}")
    
    def test_register_duplicate_username(self):
        """Test registration with existing username returns error"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": EXISTING_USERNAME,
            "password": "somepassword123",
            "full_name": "Duplicate User"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "already taken" in data["detail"].lower() or "username" in data["detail"].lower()
        print(f"Duplicate registration correctly rejected: {data['detail']}")
    
    def test_register_short_password(self):
        """Test registration with password less than 6 characters"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"TEST_short_{uuid.uuid4().hex[:8]}",
            "password": "12345",  # Only 5 characters
            "full_name": "Short Password User"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "6 characters" in data["detail"].lower() or "password" in data["detail"].lower()
        print(f"Short password correctly rejected: {data['detail']}")


class TestUserLogin:
    """User login endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with existing user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": EXISTING_USERNAME,
            "password": EXISTING_PASSWORD,
            "remember_me": False
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["username"] == EXISTING_USERNAME.lower()
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        
        print(f"Successfully logged in as: {data['user']['username']}")
    
    def test_login_with_remember_me(self):
        """Test login with remember_me flag"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": EXISTING_USERNAME,
            "password": EXISTING_PASSWORD,
            "remember_me": True
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        print("Login with remember_me successful")
    
    def test_login_invalid_username(self):
        """Test login with non-existent username"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "nonexistent_user_xyz",
            "password": "somepassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"Invalid username correctly rejected: {data['detail']}")
    
    def test_login_invalid_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": EXISTING_USERNAME,
            "password": "wrongpassword123"
        })
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"Invalid password correctly rejected: {data['detail']}")


class TestGetCurrentUser:
    """Get current user endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": EXISTING_USERNAME,
            "password": EXISTING_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_get_me_success(self, auth_token):
        """Test getting current user with valid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Get me failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert "username" in data
        assert data["username"] == EXISTING_USERNAME.lower()
        print(f"Successfully retrieved current user: {data['username']}")
    
    def test_get_me_no_token(self):
        """Test getting current user without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("Correctly rejected request without token")
    
    def test_get_me_invalid_token(self):
        """Test getting current user with invalid token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_xyz"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Correctly rejected request with invalid token")


class TestForgotPassword:
    """Forgot password endpoint tests"""
    
    def test_forgot_password_success(self):
        """Test forgot password with existing username"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "username": EXISTING_USERNAME
        })
        
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        data = response.json()
        
        assert "reset_code" in data, "Reset code not in response"
        assert "message" in data
        assert len(data["reset_code"]) == 6  # 6-digit code
        print(f"Reset code generated: {data['reset_code']}")
    
    def test_forgot_password_nonexistent_user(self):
        """Test forgot password with non-existent username"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "username": "nonexistent_user_xyz"
        })
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"Non-existent user correctly rejected: {data['detail']}")


class TestResetPassword:
    """Reset password endpoint tests"""
    
    def test_reset_password_full_flow(self):
        """Test complete forgot password -> reset password flow"""
        # First, get reset code
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "username": EXISTING_USERNAME
        })
        assert forgot_response.status_code == 200
        reset_code = forgot_response.json()["reset_code"]
        
        # Reset password with the code
        new_password = "newpassword123"
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "username": EXISTING_USERNAME,
            "reset_code": reset_code,
            "new_password": new_password
        })
        
        assert reset_response.status_code == 200, f"Reset failed: {reset_response.text}"
        data = reset_response.json()
        assert "message" in data
        print(f"Password reset successful: {data['message']}")
        
        # Verify can login with new password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": EXISTING_USERNAME,
            "password": new_password
        })
        assert login_response.status_code == 200, "Login with new password failed"
        print("Successfully logged in with new password")
        
        # Reset back to original password for other tests
        forgot_response2 = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "username": EXISTING_USERNAME
        })
        reset_code2 = forgot_response2.json()["reset_code"]
        requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "username": EXISTING_USERNAME,
            "reset_code": reset_code2,
            "new_password": EXISTING_PASSWORD
        })
        print("Password reset back to original")
    
    def test_reset_password_invalid_code(self):
        """Test reset password with invalid code"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "username": EXISTING_USERNAME,
            "reset_code": "000000",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"Invalid reset code correctly rejected: {data['detail']}")
    
    def test_reset_password_short_password(self):
        """Test reset password with short new password"""
        # First get a valid reset code
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "username": EXISTING_USERNAME
        })
        reset_code = forgot_response.json()["reset_code"]
        
        # Try to reset with short password
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "username": EXISTING_USERNAME,
            "reset_code": reset_code,
            "new_password": "12345"  # Only 5 characters
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"Short password correctly rejected: {data['detail']}")


class TestHistoryCRUD:
    """Per-user transcription history CRUD tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": EXISTING_USERNAME,
            "password": EXISTING_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed - skipping history tests")
    
    def test_create_history_item(self, auth_headers):
        """Test creating a history item"""
        response = requests.post(
            f"{BASE_URL}/api/history/",
            headers=auth_headers,
            json={
                "file_name": "TEST_audio_file.mp3",
                "language": "English",
                "transcription": "This is a test transcription.",
                "original_transcription": None,
                "date": "2026-01-16 10:00:00"
            }
        )
        
        assert response.status_code == 200, f"Create history failed: {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data["file_name"] == "TEST_audio_file.mp3"
        assert data["transcription"] == "This is a test transcription."
        print(f"Created history item with ID: {data['id']}")
        
        # Store ID for cleanup
        return data["id"]
    
    def test_get_history(self, auth_headers):
        """Test getting user's history"""
        response = requests.get(
            f"{BASE_URL}/api/history/",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Get history failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"Retrieved {len(data)} history items")
    
    def test_update_history_item(self, auth_headers):
        """Test updating a history item"""
        # First create an item
        create_response = requests.post(
            f"{BASE_URL}/api/history/",
            headers=auth_headers,
            json={
                "file_name": "TEST_update_file.mp3",
                "language": "Spanish",
                "transcription": "Original transcription",
                "date": "2026-01-16 11:00:00"
            }
        )
        item_id = create_response.json()["id"]
        
        # Update the item
        update_response = requests.put(
            f"{BASE_URL}/api/history/{item_id}",
            headers=auth_headers,
            json={
                "transcription": "Updated transcription",
                "date": "2026-01-16 12:00:00 (edited)"
            }
        )
        
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        data = update_response.json()
        assert data["transcription"] == "Updated transcription"
        print(f"Updated history item: {item_id}")
        
        # Verify update persisted
        get_response = requests.get(
            f"{BASE_URL}/api/history/",
            headers=auth_headers
        )
        items = get_response.json()
        updated_item = next((i for i in items if i["id"] == item_id), None)
        assert updated_item is not None
        assert updated_item["transcription"] == "Updated transcription"
        print("Update verified via GET")
    
    def test_delete_history_item(self, auth_headers):
        """Test deleting a history item"""
        # First create an item
        create_response = requests.post(
            f"{BASE_URL}/api/history/",
            headers=auth_headers,
            json={
                "file_name": "TEST_delete_file.mp3",
                "language": "French",
                "transcription": "To be deleted",
                "date": "2026-01-16 13:00:00"
            }
        )
        item_id = create_response.json()["id"]
        
        # Delete the item
        delete_response = requests.delete(
            f"{BASE_URL}/api/history/{item_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        print(f"Deleted history item: {item_id}")
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/history/",
            headers=auth_headers
        )
        items = get_response.json()
        deleted_item = next((i for i in items if i["id"] == item_id), None)
        assert deleted_item is None, "Item still exists after deletion"
        print("Deletion verified via GET")
    
    def test_history_requires_auth(self):
        """Test that history endpoints require authentication"""
        # GET without auth
        get_response = requests.get(f"{BASE_URL}/api/history/")
        assert get_response.status_code in [401, 403], f"Expected 401/403, got {get_response.status_code}"
        
        # POST without auth
        post_response = requests.post(f"{BASE_URL}/api/history/", json={
            "file_name": "test.mp3",
            "language": "English",
            "transcription": "test",
            "date": "2026-01-16"
        })
        assert post_response.status_code in [401, 403], f"Expected 401/403, got {post_response.status_code}"
        
        print("History endpoints correctly require authentication")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_users(self):
        """Note: In production, would clean up TEST_ prefixed users"""
        print("Test cleanup would run here - TEST_ prefixed data should be cleaned")
        # This is a placeholder - actual cleanup would require admin access
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
