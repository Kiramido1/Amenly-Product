# 📋 Frameworks API - Complete Guide

## Overview

Professional REST API for managing compliance frameworks with comprehensive filtering, statistics, and CRUD operations.

**Base URL**: `http://localhost:8001/api/v1/frameworks`

**Swagger Documentation**: `http://localhost:8001/docs#/Frameworks`

---

## 🔐 Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <your_access_token>
```

### Get Access Token

```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@first.com",
    "password": "AdminPassword123!"
  }'
```

---

## 📚 Available Endpoints

### 1. **List All Frameworks** 
`GET /api/v1/frameworks/`

Get a paginated list of frameworks with advanced filtering.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `skip` | integer | Number of records to skip (default: 0) | `skip=0` |
| `limit` | integer | Max records to return (1-100, default: 50) | `limit=20` |
| `framework_type` | enum | Filter by type: `standard`, `regulation`, `guideline` | `framework_type=regulation` |
| `category` | enum | Filter by category | `category=data_protection` |
| `region` | string | Filter by region | `region=United States` |
| `is_mandatory` | boolean | Filter by mandatory status | `is_mandatory=true` |
| `search` | string | Search in name or description | `search=GDPR` |

#### Example Request

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/?framework_type=regulation&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Retrieved 10 frameworks",
  "data": {
    "frameworks": [
      {
        "id": "uuid",
        "name": "GDPR",
        "version": "2016/679",
        "framework_type": "regulation",
        "category": "data_protection",
        "region": "European Union",
        "is_mandatory": true,
        "created_at": "2026-05-09T04:17:08.817027"
      }
    ],
    "total": 13,
    "skip": 0,
    "limit": 10,
    "filters": {
      "framework_type": "regulation",
      "category": null,
      "region": null,
      "is_mandatory": null,
      "search": null
    }
  }
}
```

---

### 2. **Get Framework Statistics**
`GET /api/v1/frameworks/stats`

Get comprehensive statistics about frameworks.

#### Example Request

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/stats" \
  -H "Authorization: Bearer $TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Framework statistics retrieved successfully",
  "data": {
    "total": 21,
    "by_type": {
      "regulation": 13,
      "standard": 8
    },
    "by_category": {
      "data_protection": 6,
      "financial": 3,
      "information_security": 3,
      "healthcare": 2,
      "privacy": 2,
      "payment_security": 1,
      "automotive": 1,
      "it_governance": 1,
      "cybersecurity": 1,
      "general": 1
    },
    "by_region": {
      "United States": 7,
      "Global": 3,
      "European Union": 2,
      "Egypt": 1,
      "UAE": 1,
      "Morocco": 1,
      "Brazil": 1,
      "Canada": 1,
      "China": 1,
      "California, USA": 1,
      "Germany/Europe": 1
    },
    "mandatory_count": 16,
    "optional_count": 5
  }
}
```

---

### 3. **Get Framework Types**
`GET /api/v1/frameworks/types`

Get list of available framework types with descriptions.

#### Example Request

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/types" \
  -H "Authorization: Bearer $TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Framework types retrieved successfully",
  "data": {
    "types": [
      {
        "value": "standard",
        "label": "Standard",
        "description": "Industry standards and best practices (e.g., ISO 27001, NIST CSF, SOC 2)"
      },
      {
        "value": "regulation",
        "label": "Regulation",
        "description": "Legal regulations and compliance requirements (e.g., GDPR, HIPAA, CCPA)"
      },
      {
        "value": "guideline",
        "label": "Guideline",
        "description": "Recommended guidelines and frameworks"
      }
    ]
  }
}
```

---

### 4. **Get Framework Categories**
`GET /api/v1/frameworks/categories`

Get list of all available framework categories.

#### Example Request

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/categories" \
  -H "Authorization: Bearer $TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Framework categories retrieved successfully",
  "data": {
    "categories": [
      {"value": "information_security", "label": "Information Security"},
      {"value": "cybersecurity", "label": "Cybersecurity"},
      {"value": "data_protection", "label": "Data Protection"},
      {"value": "privacy", "label": "Privacy"},
      {"value": "financial", "label": "Financial"},
      {"value": "healthcare", "label": "Healthcare"},
      {"value": "payment_security", "label": "Payment Security"},
      {"value": "it_governance", "label": "It Governance"},
      {"value": "cloud_security", "label": "Cloud Security"},
      {"value": "automotive", "label": "Automotive"},
      {"value": "general", "label": "General"}
    ]
  }
}
```

---

### 5. **Get Available Regions**
`GET /api/v1/frameworks/regions`

Get list of all regions with framework counts.

#### Example Request

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/regions" \
  -H "Authorization: Bearer $TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Framework regions retrieved successfully",
  "data": {
    "regions": [
      {"region": "United States", "count": 7},
      {"region": "Global", "count": 3},
      {"region": "European Union", "count": 2},
      {"region": "Egypt", "count": 1}
    ]
  }
}
```

---

### 6. **Get Single Framework**
`GET /api/v1/frameworks/{framework_id}`

Get detailed information about a specific framework.

#### Example Request

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/20b9a2ab-bc54-4b51-b238-17cbf475ccfa" \
  -H "Authorization: Bearer $TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Framework retrieved successfully",
  "data": {
    "framework": {
      "id": "20b9a2ab-bc54-4b51-b238-17cbf475ccfa",
      "name": "GDPR",
      "version": "2016/679",
      "description": "General Data Protection Regulation (EU)...",
      "organization_id": "4e561aa7-f43a-4fd5-91d8-57eda6e9da04",
      "framework_type": "regulation",
      "category": "data_protection",
      "region": "European Union",
      "industry": "General",
      "is_mandatory": true,
      "official_url": "https://gdpr.eu/",
      "created_at": "2026-05-09T04:17:08.817027",
      "updated_at": "2026-05-09T07:48:15.123456"
    }
  }
}
```

---

### 7. **Create Framework** 🔒 Admin Only
`POST /api/v1/frameworks/`

Create a new compliance framework.

#### Request Body

```json
{
  "name": "NIST Privacy Framework",
  "version": "1.0",
  "description": "A voluntary tool to help organizations manage privacy risks",
  "organization_id": "4e561aa7-f43a-4fd5-91d8-57eda6e9da04",
  "framework_type": "guideline",
  "category": "privacy",
  "region": "United States",
  "industry": "General",
  "is_mandatory": false,
  "official_url": "https://www.nist.gov/privacy-framework"
}
```

#### Example Request

```bash
curl -X POST "http://localhost:8001/api/v1/frameworks/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NIST Privacy Framework",
    "version": "1.0",
    "description": "A voluntary tool to help organizations manage privacy risks",
    "organization_id": "4e561aa7-f43a-4fd5-91d8-57eda6e9da04",
    "framework_type": "guideline",
    "category": "privacy",
    "region": "United States",
    "industry": "General",
    "is_mandatory": false,
    "official_url": "https://www.nist.gov/privacy-framework"
  }'
```

#### Example Response

```json
{
  "success": true,
  "message": "Framework created successfully",
  "data": {
    "framework": {
      "id": "new-uuid",
      "name": "NIST Privacy Framework",
      "version": "1.0",
      "framework_type": "guideline",
      "category": "privacy",
      "region": "United States",
      "is_mandatory": false,
      "created_at": "2026-05-09T08:00:00.000000"
    }
  }
}
```

---

### 8. **Update Framework** 🔒 Admin Only
`PATCH /api/v1/frameworks/{framework_id}`

Update an existing framework.

#### Request Body (all fields optional)

```json
{
  "name": "GDPR (Updated)",
  "version": "2016/679 Rev. 1",
  "description": "Updated description",
  "framework_type": "regulation",
  "category": "data_protection",
  "region": "European Union",
  "industry": "General",
  "is_mandatory": true,
  "official_url": "https://gdpr.eu/"
}
```

#### Example Request

```bash
curl -X PATCH "http://localhost:8001/api/v1/frameworks/20b9a2ab-bc54-4b51-b238-17cbf475ccfa" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for GDPR"
  }'
```

---

### 9. **Delete Framework** 🔒 Admin Only
`DELETE /api/v1/frameworks/{framework_id}`

Delete a framework (also deletes all associated controls and assessments).

#### Example Request

```bash
curl -X DELETE "http://localhost:8001/api/v1/frameworks/20b9a2ab-bc54-4b51-b238-17cbf475ccfa" \
  -H "Authorization: Bearer $TOKEN"
```

#### Example Response

```json
{
  "success": true,
  "message": "Framework 'GDPR' deleted successfully"
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Get All Mandatory Regulations

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/?framework_type=regulation&is_mandatory=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Use Case 2: Get All Data Protection Frameworks

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/?category=data_protection" \
  -H "Authorization: Bearer $TOKEN"
```

### Use Case 3: Get All US Frameworks

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/?region=United%20States" \
  -H "Authorization: Bearer $TOKEN"
```

### Use Case 4: Search for Healthcare Frameworks

```bash
curl -X GET "http://localhost:8001/api/v1/frameworks/?search=health" \
  -H "Authorization: Bearer $TOKEN"
```

### Use Case 5: Get Dashboard Statistics

```bash
# Get stats
curl -X GET "http://localhost:8001/api/v1/frameworks/stats" \
  -H "Authorization: Bearer $TOKEN"

# Get regions
curl -X GET "http://localhost:8001/api/v1/frameworks/regions" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Response Format

All endpoints follow a consistent response format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "detail": "Detailed error information"
}
```

---

## 🔑 Framework Types

| Type | Description | Examples |
|------|-------------|----------|
| **standard** | Industry standards and best practices | ISO 27001, NIST CSF, SOC 2, PCI DSS |
| **regulation** | Legal regulations and compliance requirements | GDPR, HIPAA, CCPA, SOX |
| **guideline** | Recommended guidelines and frameworks | NIST Privacy Framework |

---

## 📂 Framework Categories

- `information_security` - Information Security Management
- `cybersecurity` - Cybersecurity Frameworks
- `data_protection` - Data Protection Laws
- `privacy` - Privacy Regulations
- `financial` - Financial Compliance
- `healthcare` - Healthcare Regulations
- `payment_security` - Payment Card Security
- `it_governance` - IT Governance Frameworks
- `cloud_security` - Cloud Security Standards
- `automotive` - Automotive Industry Standards
- `general` - General Purpose Frameworks

---

## 🔒 Permissions

| Endpoint | Permission Required |
|----------|-------------------|
| GET (List, Stats, Types, Categories, Regions) | Authenticated User |
| GET (Single Framework) | Authenticated User (Same Organization) |
| POST (Create) | Organization Admin |
| PATCH (Update) | Organization Admin |
| DELETE | Organization Admin |

---

## 💡 Tips

1. **Pagination**: Always use `skip` and `limit` for large datasets
2. **Filtering**: Combine multiple filters for precise results
3. **Search**: Use the `search` parameter for quick lookups
4. **Statistics**: Use `/stats` endpoint for dashboard widgets
5. **Caching**: Consider caching `/types`, `/categories`, and `/regions` responses

---

## 🧪 Testing in Swagger

1. Go to: `http://localhost:8001/docs`
2. Click on **"Frameworks"** section
3. Click **"Authorize"** button (top right)
4. Enter your access token
5. Try any endpoint!

---

## 📝 Example: Complete Workflow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@first.com","password":"AdminPassword123!"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 2. Get statistics
curl -X GET "http://localhost:8001/api/v1/frameworks/stats" \
  -H "Authorization: Bearer $TOKEN"

# 3. List all regulations
curl -X GET "http://localhost:8001/api/v1/frameworks/?framework_type=regulation" \
  -H "Authorization: Bearer $TOKEN"

# 4. Get specific framework
curl -X GET "http://localhost:8001/api/v1/frameworks/{framework_id}" \
  -H "Authorization: Bearer $TOKEN"

# 5. Create new framework (Admin only)
curl -X POST "http://localhost:8001/api/v1/frameworks/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## ✅ Status

- **Backend**: Running on port 8001
- **Swagger**: Available at `/docs`
- **Endpoints**: 9 professional endpoints
- **Filters**: Type, Category, Region, Mandatory, Search
- **Statistics**: Complete analytics
- **Authentication**: JWT-based
- **Permissions**: Role-based access control

---

**Created**: May 9, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
