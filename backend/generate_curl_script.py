import json
import re

with open("openapi.json", "r") as f:
    schema = json.load(f)

BASE_URL = "http://127.0.0.1:8001"
TOKEN_VAR = "$TOKEN"

curl_commands = []
curl_commands.append("#!/bin/bash\n")
curl_commands.append("echo '====================================='")
curl_commands.append("echo 'Testing Swagger endpoints using curl'")
curl_commands.append("echo '=====================================\n'")
curl_commands.append(f"BASE_URL=\"{BASE_URL}\"\n")
curl_commands.append("TOKEN=\"YOUR_ACCESS_TOKEN_HERE\"\n")

for path, path_item in schema.get("paths", {}).items():
    for method, operation in path_item.items():
        if method.lower() not in ["get", "post", "put", "delete", "patch"]:
            continue
            
        url = f"{BASE_URL}{path}"
        url = re.sub(r'\{.*?\}', '1', url)
        
        headers = "-H 'accept: application/json'"
        if "security" in operation:
            headers += f" -H 'Authorization: Bearer {TOKEN_VAR}'"
            
        data = ""
        if method.lower() in ["post", "put", "patch"] and "requestBody" in operation:
            headers += " -H 'Content-Type: application/json'"
            data = " -d '{}'"
            
        # Using -s to hide progress, -S to show errors, and -w to print status code
        curl_cmd = f"curl -s -S -X '{method.upper()}' \\\n  '{url}' \\\n  {headers}{data} \\\n  -w '\\nHTTP Status: %{{http_code}}\\n'"
        
        summary = operation.get("summary", f"{method.upper()} {path}")
        curl_commands.append(f"echo '▶ Testing: {summary}'")
        curl_commands.append(f"eval \"{curl_cmd}\"")
        curl_commands.append("echo '-------------------------------------'")
        curl_commands.append("sleep 0.5\n")

with open("test_all_endpoints.sh", "w") as f:
    f.write("\n".join(curl_commands))

print("Generated test_all_endpoints.sh")
