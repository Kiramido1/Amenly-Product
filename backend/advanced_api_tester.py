import json
import requests
import re
import sys
import time

BASE_URL = "http://127.0.0.1:8001"

ACCOUNTS = {
    "ADMIN": {"email": "admin@first.com", "password": "AdminPassword123!"},
    "MEMBER": {"email": "member1@first.com", "password": "MemberPass1!"},
}


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    RESET = "\033[0m"
    BOLD = "\033[1m"


def get_token(email, password):
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login", json={"email": email, "password": password}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        else:
            print(f"{Colors.RED}Failed to login with {email}: {response.text}{Colors.RESET}")
            return None
    except Exception as e:
        print(f"{Colors.RED}Error connecting to server: {e}{Colors.RESET}")
        return None


def main():
    print(
        f"{Colors.CYAN}{Colors.BOLD}===================================================={Colors.RESET}"
    )
    print(f"{Colors.CYAN}{Colors.BOLD}   Automated API Tester for Amenly Backend{Colors.RESET}")
    print(
        f"{Colors.CYAN}{Colors.BOLD}===================================================={Colors.RESET}\n"
    )

    # Load OpenAPI Schema
    try:
        openapi_resp = requests.get(f"{BASE_URL}/api/v1/openapi.json")
        schema = openapi_resp.json()
    except Exception as e:
        print(
            f"{Colors.RED}Could not fetch OpenAPI schema from {BASE_URL}/api/v1/openapi.json. Make sure the server is running.{Colors.RESET}"
        )
        sys.exit(1)

    # Get Tokens
    print(f"{Colors.YELLOW}Authenticating...{Colors.RESET}")
    admin_token = get_token(ACCOUNTS["ADMIN"]["email"], ACCOUNTS["ADMIN"]["password"])
    member_token = get_token(ACCOUNTS["MEMBER"]["email"], ACCOUNTS["MEMBER"]["password"])

    if not admin_token and not member_token:
        print(f"{Colors.RED}Could not authenticate any accounts. Aborting.{Colors.RESET}")
        sys.exit(1)

    print(f"{Colors.GREEN}Authentication successful!{Colors.RESET}\n")

    roles_to_test = []
    if admin_token:
        roles_to_test.append(("ADMIN", admin_token))
    if member_token:
        roles_to_test.append(("MEMBER", member_token))

    paths = schema.get("paths", {})

    for role_name, token in roles_to_test:
        print(
            f"\n{Colors.BOLD}{Colors.CYAN}--- Testing Endpoints as: {role_name} ---{Colors.RESET}\n"
        )

        headers = {"accept": "application/json", "Authorization": f"Bearer {token}"}

        for path, path_item in paths.items():
            for method, operation in path_item.items():
                if method.lower() not in ["get", "post", "put", "delete", "patch"]:
                    continue

                # Prepare URL
                url = f"{BASE_URL}{path}"
                url = re.sub(r"\{.*?\}", "1", url)  # Replace path params like {id} with 1

                # Prepare Data
                req_headers = headers.copy()
                data = None

                # We skip logout so the token doesn't get invalidated during testing!
                if "logout" in path.lower():
                    continue

                if method.lower() in ["post", "put", "patch"]:
                    if "requestBody" in operation:
                        req_headers["Content-Type"] = "application/json"
                        # Send an empty JSON object to prevent simple syntax errors,
                        # this might result in 422 but at least the endpoint is hit.
                        data = {}

                # Execute Request
                summary = operation.get("summary", f"{method.upper()} {path}")
                try:
                    start_time = time.time()
                    if method.lower() == "get":
                        res = requests.get(url, headers=req_headers, timeout=5)
                    elif method.lower() == "post":
                        res = requests.post(url, headers=req_headers, json=data, timeout=5)
                    elif method.lower() == "put":
                        res = requests.put(url, headers=req_headers, json=data, timeout=5)
                    elif method.lower() == "patch":
                        res = requests.patch(url, headers=req_headers, json=data, timeout=5)
                    elif method.lower() == "delete":
                        res = requests.delete(url, headers=req_headers, timeout=5)

                    duration = (time.time() - start_time) * 1000

                    status_color = (
                        Colors.GREEN
                        if res.status_code < 400
                        else Colors.YELLOW if res.status_code < 500 else Colors.RED
                    )

                    print(
                        f"{status_color}[{res.status_code}]{Colors.RESET} {method.upper():<6} {path:<40} {duration:.0f}ms"
                    )

                    # Print 403 Forbidden specifically to see RBAC in action
                    if res.status_code == 403:
                        print(
                            f"      {Colors.YELLOW}↳ RBAC: Forbidden for {role_name}{Colors.RESET}"
                        )

                except Exception as e:
                    print(
                        f"{Colors.RED}[ERR]{Colors.RESET} {method.upper():<6} {path:<40} Failed: {str(e)}"
                    )

        print(f"\n{Colors.CYAN}Completed tests for {role_name}{Colors.RESET}")


if __name__ == "__main__":
    main()
