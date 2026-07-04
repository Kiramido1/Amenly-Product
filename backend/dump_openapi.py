import json
import sys

# Add current directory to path so 'app' can be imported
sys.path.append('.')

try:
    from app.main import app
    with open("openapi.json", "w") as f:
        json.dump(app.openapi(), f, indent=2)
    print("Successfully dumped openapi.json")
except Exception as e:
    print(f"Error dumping openapi.json: {e}")
