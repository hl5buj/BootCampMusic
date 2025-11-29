import urllib.request
import urllib.parse
import json
import time
import sys

BASE_URL = "http://localhost:8088/api"
FRONTEND_URL = "http://localhost:5173"

def wait_for_service(url, name, timeout=120):
    print(f"Waiting for {name} at {url}...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url) as response:
                if response.getcode() < 500:
                    print(f"{name} is up!")
                    return True
        except Exception as e:
            # print(e)
            time.sleep(2)
    print(f"{name} failed to start.")
    return False

def test_api():
    print(f"Testing API at {BASE_URL}")
    
    # 1. Register
    reg_url = f"{BASE_URL}/auth/register/"
    username = f"testuser_{int(time.time())}"
    password = "testpassword123"
    data = json.dumps({
        "username": username,
        "password": password,
        "email": f"{username}@example.com"
    }).encode('utf-8')
    
    print(f"Attempting to register user: {username}")
    req = urllib.request.Request(reg_url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 201:
                print("✅ Registration successful")
            else:
                print(f"❌ Registration failed: {response.getcode()}")
                return
    except urllib.error.HTTPError as e:
        print(f"❌ Registration error: {e.code} {e.read().decode()}")
        return
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return

    # 2. Login
    login_url = f"{BASE_URL}/auth/login/"
    print("Attempting to login...")
    req = urllib.request.Request(login_url, data=data, headers={'Content-Type': 'application/json'})
    token = None
    try:
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                res_json = json.loads(response.read().decode())
                token = res_json.get('token')
                print(f"✅ Login successful. Token: {token[:10]}...")
            else:
                print(f"❌ Login failed: {response.getcode()}")
                return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return

    # 3. List Tracks
    tracks_url = f"{BASE_URL}/music/tracks/"
    print("Fetching tracks...")
    try:
        with urllib.request.urlopen(tracks_url) as response:
            if response.getcode() == 200:
                tracks = json.loads(response.read().decode())
                print(f"✅ Fetch tracks successful (Count: {len(tracks)})")
            else:
                print(f"❌ Fetch tracks failed: {response.getcode()}")
    except Exception as e:
        print(f"❌ Fetch tracks error: {e}")

if __name__ == "__main__":
    # Check Backend
    # We check /admin/login/ because it's a standard HTML page that should load
    if not wait_for_service("http://localhost:8088/admin/login/", "Backend"):
        sys.exit(1)
    
    # Check Frontend
    if not wait_for_service(FRONTEND_URL, "Frontend"):
        sys.exit(1)
        
    print("\nStarting API Tests...")
    test_api()
