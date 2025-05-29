#!/usr/bin/env python3
import requests
import json
import time
import os
import sys
from datetime import datetime

# Get the backend URL from the frontend .env file
def get_backend_url():
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                return line.strip().split('=')[1].strip('"\'')
    return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("Error: Could not find REACT_APP_BACKEND_URL in frontend/.env")
    sys.exit(1)

API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

def test_login():
    """Test login with provided credentials"""
    print("\n=== Testing Login with Provided Credentials ===")
    try:
        payload = {
            "email": "testsalon@example.com",
            "password": "testpass123"
        }
        
        response = requests.post(f"{API_URL}/salon/login", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            access_token = response.json().get("access_token")
            salon_id = response.json().get("salon_id")
            print(f"✅ Login successful. Salon ID: {salon_id}")
            return access_token
        else:
            print(f"Response: {response.text}")
            print("❌ Login failed. Attempting to register the test account...")
            
            # Try to register the test account
            register_payload = {
                "email": "testsalon@example.com",
                "password": "testpass123",
                "salon_name": "Test Salon Demo",
                "owner_name": "Demo Owner",
                "phone": "1234567890",
                "address": "123 Test Street, Test City"
            }
            
            register_response = requests.post(f"{API_URL}/salon/register", json=register_payload)
            print(f"Registration Status Code: {register_response.status_code}")
            
            if register_response.status_code == 200:
                print(f"Registration Response: {register_response.json()}")
                access_token = register_response.json().get("access_token")
                salon_id = register_response.json().get("salon_id")
                print(f"✅ Registration successful. Salon ID: {salon_id}")
                return access_token
            else:
                print(f"Registration Response: {register_response.text}")
                print("❌ Registration also failed. Cannot proceed with tests.")
                return None
    except Exception as e:
        print(f"❌ Login test failed: {str(e)}")
        return None

def test_list_backups(access_token):
    """Test listing available backups"""
    print("\n=== Testing List Backups Endpoint ===")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(f"{API_URL}/admin/backups", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            print("✅ List backups endpoint test passed")
            return True
        else:
            print(f"Response: {response.text}")
            print("❌ List backups endpoint test failed")
            return False
    except Exception as e:
        print(f"❌ List backups endpoint test failed: {str(e)}")
        return False

def test_create_backup(access_token):
    """Test creating a new backup"""
    print("\n=== Testing Create Backup Endpoint ===")
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.post(f"{API_URL}/admin/backup", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            print("✅ Create backup endpoint test passed")
            return True
        else:
            print(f"Response: {response.text}")
            print("❌ Create backup endpoint test failed")
            return False
    except Exception as e:
        print(f"❌ Create backup endpoint test failed: {str(e)}")
        return False

def test_restore_backup(access_token):
    """Test restoring from a backup"""
    print("\n=== Testing Restore Backup Endpoint ===")
    print("⚠️ WARNING: This will restore the database from the latest backup!")
    print("⚠️ This could potentially overwrite current data.")
    
    # Ask for confirmation
    confirm = input("Do you want to proceed with testing the restore endpoint? (yes/no): ")
    if confirm.lower() != "yes":
        print("Skipping restore test.")
        return None
    
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.post(f"{API_URL}/admin/restore", headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            print("✅ Restore backup endpoint test passed")
            return True
        else:
            print(f"Response: {response.text}")
            print("❌ Restore backup endpoint test failed")
            return False
    except Exception as e:
        print(f"❌ Restore backup endpoint test failed: {str(e)}")
        return False

def check_backup_directory():
    """Check if the backup directory exists and contains backups"""
    print("\n=== Checking Backup Directory ===")
    try:
        backup_dir = "/app/data_backups"
        
        if not os.path.exists(backup_dir):
            print(f"❌ Backup directory {backup_dir} does not exist")
            return False
        
        backups = [d for d in os.listdir(backup_dir) if d.startswith('backup_') and os.path.isdir(os.path.join(backup_dir, d))]
        backups.sort(reverse=True)
        
        if not backups:
            print(f"❌ No backups found in {backup_dir}")
            return False
        
        print(f"✅ Found {len(backups)} backups in {backup_dir}:")
        for backup in backups:
            backup_path = os.path.join(backup_dir, backup)
            info_path = os.path.join(backup_path, "backup_info.json")
            
            if os.path.exists(info_path):
                with open(info_path, 'r') as f:
                    info = json.load(f)
                print(f"  📅 {backup} - {info['total_documents']} documents")
            else:
                print(f"  📅 {backup}")
        
        # Check if "latest" symlink exists
        latest_path = os.path.join(backup_dir, "latest")
        if os.path.exists(latest_path) and os.path.islink(latest_path):
            target = os.readlink(latest_path)
            print(f"✅ 'latest' symlink points to: {target}")
        else:
            print("❌ 'latest' symlink does not exist")
        
        return True
    except Exception as e:
        print(f"❌ Error checking backup directory: {str(e)}")
        return False

def run_backup_tests():
    """Run all backup-related tests"""
    print("\n=== Starting QueueBee Backup System Tests ===")
    print(f"Testing API at: {API_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    # First, login to get an access token
    access_token = test_login()
    if not access_token:
        print("❌ Cannot proceed with tests without authentication")
        return False
    
    # Test listing backups
    list_result = test_list_backups(access_token)
    
    # Test creating a new backup
    create_result = test_create_backup(access_token)
    
    # Check backup directory
    dir_result = check_backup_directory()
    
    # Test listing backups again to see the new backup
    if create_result:
        print("\n=== Testing List Backups Again After Creating New Backup ===")
        list_again_result = test_list_backups(access_token)
    else:
        list_again_result = False
    
    # Test restore functionality (optional, requires confirmation)
    restore_result = test_restore_backup(access_token)
    
    # Print summary
    print("\n=== Backup System Test Summary ===")
    print(f"Login: {'✅ PASSED' if access_token else '❌ FAILED'}")
    print(f"List Backups: {'✅ PASSED' if list_result else '❌ FAILED'}")
    print(f"Create Backup: {'✅ PASSED' if create_result else '❌ FAILED'}")
    print(f"Check Backup Directory: {'✅ PASSED' if dir_result else '❌ FAILED'}")
    print(f"List Backups After Creation: {'✅ PASSED' if list_again_result else '❌ FAILED'}")
    if restore_result is not None:
        print(f"Restore Backup: {'✅ PASSED' if restore_result else '❌ FAILED'}")
    else:
        print("Restore Backup: SKIPPED")
    
    all_passed = access_token and list_result and create_result and dir_result and list_again_result
    if restore_result is not None:
        all_passed = all_passed and restore_result
    
    if all_passed:
        print("\n🎉 All backup system tests passed! The QueueBee backup functionality is working correctly.")
    else:
        print("\n❌ Some backup system tests failed. Please check the logs above for details.")
    
    return all_passed

if __name__ == "__main__":
    run_backup_tests()