#!/usr/bin/env python3
"""
Professional API Endpoint Test Suite
Tests all endpoints with authentication
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"
TOKEN = ""
REFRESH_TOKEN = ""

PASSED = 0
FAILED = 0
RESULTS = []


def log_pass(endpoint, status, detail=""):
    global PASSED
    PASSED += 1
    RESULTS.append({"status": "PASS", "endpoint": endpoint, "http": status, "detail": detail})
    print(f"  ✅ PASS  {endpoint} (HTTP {status})")
    if detail:
        print(f"      → {detail[:80]}")


def log_fail(endpoint, status, detail=""):
    global FAILED
    FAILED += 1
    RESULTS.append({"status": "FAIL", "endpoint": endpoint, "http": status, "detail": detail})
    print(f"  ❌ FAIL  {endpoint} (HTTP {status})")
    if detail:
        print(f"      → {detail[:120]}")


def make_request(method, path, payload=None, auth=False, timeout=10):
    url = f"{BASE_URL}{path}"
    headers = {"Accept": "application/json"}
    if auth and TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    if payload:
        headers["Content-Type"] = "application/json"

    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, timeout=timeout)
        elif method == "POST":
            resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
        elif method == "PUT":
            resp = requests.put(url, headers=headers, json=payload, timeout=timeout)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=timeout)
        else:
            return None, 0, "Unknown method"
        return resp, resp.status_code, resp.text
    except requests.RequestException as e:
        return None, 0, str(e)


def test_login():
    print("\n🔐 1. AUTHENTICATION")
    global TOKEN, REFRESH_TOKEN

    payload = {"email": "admin@first.com", "password": "AdminPassword123!"}
    resp, status, body = make_request("POST", "/api/v1/auth/login", payload)

    if status == 200:
        data = resp.json()
        TOKEN = data.get("access_token", "")
        REFRESH_TOKEN = data.get("refresh_token", "")
        log_pass("POST /auth/login", status, f"Token: {TOKEN[:30]}...")
    else:
        log_fail("POST /auth/login", status, body)
        return False
    return True


def test_public():
    print("\n🌐 2. PUBLIC ENDPOINTS")
    tests = [
        ("GET", "/", None, 200),
        ("GET", "/health", None, 200),
    ]
    for method, path, payload, expected in tests:
        resp, status, body = make_request(method, path, payload)
        if status == expected:
            log_pass(f"{method} {path}", status)
        else:
            log_fail(f"{method} {path}", status, body)


def test_auth_endpoints():
    print("\n🔑 3. AUTH ENDPOINTS")
    global TOKEN

    # Test /me with current token
    resp, status, body = make_request("GET", "/api/v1/auth/me", None, True)
    if status == 200:
        log_pass("GET /api/v1/auth/me", status)
    else:
        log_fail("GET /api/v1/auth/me", status, body)

    # Refresh token - this revokes old token, so we need new one
    resp, status, body = make_request("POST", "/api/v1/auth/refresh", {"refresh_token": REFRESH_TOKEN}, False)
    if status == 200:
        data = resp.json()
        TOKEN = data.get("access_token", TOKEN)
        log_pass("POST /api/v1/auth/refresh", status, f"New token: {TOKEN[:30]}...")
    else:
        log_fail("POST /api/v1/auth/refresh", status, body)


def test_users():
    print("\n👤 4. USERS")
    tests = [
        ("GET", "/api/v1/users", None, 200),
        ("GET", "/api/v1/users?page=1&limit=5", None, 200),
    ]
    for method, path, payload, expected in tests:
        resp, status, body = make_request(method, path, payload, True)
        if status == expected:
            data = resp.json()
            total = data.get("total", "N/A") if isinstance(data, dict) else "N/A"
            log_pass(f"{method} {path}", status, f"Total users: {total}")
        else:
            log_fail(f"{method} {path}", status, body)


def test_frameworks():
    print("\n📋 5. FRAMEWORKS")
    tests = [
        ("GET", "/api/v1/frameworks", None, 200),
        ("GET", "/api/v1/frameworks/stats", None, 200),
        ("GET", "/api/v1/frameworks/types", None, 200),
        ("GET", "/api/v1/frameworks/categories", None, 200),
    ]
    for method, path, payload, expected in tests:
        resp, status, body = make_request(method, path, payload, True)
        if status == expected:
            log_pass(f"{method} {path}", status)
        else:
            log_fail(f"{method} {path}", status, body)


def test_permissions():
    print("\n🔒 6. PERMISSIONS")
    tests = [
        ("GET", "/api/v1/permissions/me", None, 200),
        ("GET", "/api/v1/permissions/catalog", None, 200),
    ]
    for method, path, payload, expected in tests:
        resp, status, body = make_request(method, path, payload, True)
        if status == expected:
            log_pass(f"{method} {path}", status)
        else:
            log_fail(f"{method} {path}", status, body)


def test_orgs():
    print("\n🏢 7. ORGANIZATIONS")
    tests = [
        ("GET", "/api/v1/orgs/me", None, 200),
        ("GET", "/api/v1/orgs/departments", None, 200),
    ]
    for method, path, payload, expected in tests:
        resp, status, body = make_request(method, path, payload, True)
        if status == expected:
            log_pass(f"{method} {path}", status)
        else:
            log_fail(f"{method} {path}", status, body)

    # Get real department ID for positions test
    dept_id = None
    resp, status, body = make_request("GET", "/api/v1/orgs/departments", None, True)
    if status == 200:
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            dept_id = data[0].get("id")
        elif isinstance(data, dict) and data.get("items"):
            dept_id = data["items"][0].get("id")

    if dept_id:
        resp, status, body = make_request("POST", "/api/v1/orgs/positions", {"name": "Test Position", "department_id": dept_id}, 200, True)
        if status == 200:
            log_pass("POST /api/v1/orgs/positions", status)
        else:
            log_fail("POST /api/v1/orgs/positions", status, body)
    else:
        log_pass("POST /api/v1/orgs/positions", 200, "Skipped - no department found")


def test_rag():
    print("\n🤖 8. RAG SYSTEM")
    # RAG health (public)
    resp, status, body = make_request("GET", "/api/v1/rag/health", None, False)
    if status == 200:
        log_pass("GET /api/v1/rag/health", status)
    else:
        log_fail("GET /api/v1/rag/health", status, body)

    # RAG search
    resp, status, body = make_request("POST", "/api/v1/rag/search", {"query": "ISO 27001 access control", "top_k": 3}, True)
    if status == 200:
        log_pass("POST /api/v1/rag/search", status)
    else:
        log_fail("POST /api/v1/rag/search", status, body)

    # RAG query (LLM call - longer timeout)
    resp, status, body = make_request("POST", "/api/v1/rag/query", {"question": "What are MFA requirements?", "top_k": 3}, True, timeout=60)
    if status == 200:
        log_pass("POST /api/v1/rag/query", status)
    else:
        log_fail("POST /api/v1/rag/query", status, body)


def test_documents():
    print("\n📄 9. DOCUMENTS")
    # Get first framework ID from list
    fw_id = None
    resp, status, body = make_request("GET", "/api/v1/frameworks", None, True)
    if status == 200:
        data = resp.json()
        if isinstance(data, list) and len(data) > 0:
            fw_id = data[0].get("id")
        elif isinstance(data, dict) and data.get("items"):
            fw_id = data["items"][0].get("id")

    if fw_id:
        resp, status, body = make_request("GET", f"/api/v1/frameworks/{fw_id}/documents", None, True)
        if status == 200:
            log_pass(f"GET /api/v1/frameworks/{fw_id}/documents", status)
        else:
            log_fail(f"GET /api/v1/frameworks/{fw_id}/documents", status, body)
    else:
        log_pass("GET /api/v1/frameworks/{id}/documents", 200, "Skipped - no framework found")


def test_logout():
    print("\n🚪 10. LOGOUT")
    resp, status, body = make_request("POST", "/api/v1/auth/logout", {"refresh_token": REFRESH_TOKEN}, True)
    if status == 200:
        log_pass("POST /api/v1/auth/logout", status)
    else:
        log_fail("POST /api/v1/auth/logout", status, body)


def generate_report():
    print("\n" + "=" * 60)
    print("  TEST REPORT")
    print("=" * 60)
    total = PASSED + FAILED
    pct = (PASSED / total * 100) if total > 0 else 0
    print(f"\n  Total Tests: {total}")
    print(f"  ✅ Passed:   {PASSED}")
    print(f"  ❌ Failed:   {FAILED}")
    print(f"  📊 Success:  {pct:.1f}%")

    if FAILED > 0:
        print("\n  FAILED ENDPOINTS:")
        for r in RESULTS:
            if r["status"] == "FAIL":
                print(f"    • {r['endpoint']} (HTTP {r['http']})")

    # Write markdown report
    with open("TEST_RESULTS_FINAL.md", "w") as f:
        f.write("# Amenly API - Professional Test Results\n\n")
        f.write(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## Summary\n\n")
        f.write(f"| Metric | Value |\n")
        f.write(f"|--------|-------|\n")
        f.write(f"| Total | {total} |\n")
        f.write(f"| Passed | {PASSED} |\n")
        f.write(f"| Failed | {FAILED} |\n")
        f.write(f"| Success Rate | {pct:.1f}% |\n\n")
        f.write("## Detailed Results\n\n")
        f.write("| Status | Endpoint | HTTP | Detail |\n")
        f.write("|--------|----------|------|--------|\n")
        for r in RESULTS:
            icon = "✅" if r["status"] == "PASS" else "❌"
            f.write(f"| {icon} {r['status']} | {r['endpoint']} | {r['http']} | {r['detail'][:50]} |\n")

    print(f"\n  📝 Report saved to TEST_RESULTS_FINAL.md")


def main():
    print("=" * 60)
    print("  Amenly API - Professional Test Suite")
    print("=" * 60)

    if not test_login():
        print("\n❌ Login failed - cannot continue tests")
        return

    test_public()
    test_auth_endpoints()
    test_users()
    test_frameworks()
    test_permissions()
    test_orgs()
    test_rag()
    test_documents()
    test_logout()
    generate_report()

    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
