# Many-to-Many Framework-Organization Relationship Migration

## ✅ Status: COMPLETE

## 📋 Overview
Successfully migrated the Frameworks-Organizations relationship from One-to-Many to Many-to-Many, allowing frameworks to be associated with multiple organizations.

---

## 🔄 Database Changes

### Junction Table Created
- **Table**: `organization_frameworks`
- **Columns**:
  - `id` (UUID, Primary Key)
  - `organization_id` (UUID, Foreign Key → organizations.id)
  - `framework_id` (UUID, Foreign Key → frameworks.id)
  - `created_at` (DateTime)
  - `updated_at` (DateTime)
- **Constraints**:
  - Unique constraint on (organization_id, framework_id)
  - CASCADE delete on both foreign keys
- **Indexes**:
  - Index on organization_id
  - Index on framework_id

### Frameworks Table Modified
- **Removed**: `organization_id` column
- **Removed**: Foreign key constraint to organizations
- **Removed**: Index on organization_id

### Data Migration
- All 22 existing frameworks successfully migrated to junction table
- No data loss
- All framework-organization relationships preserved

---

## 🔧 Code Changes

### 1. Models (`backend/app/models/compliance.py`)
```python
# Added junction table definition
organization_frameworks = Table(
    'organization_frameworks',
    Base.metadata,
    Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column('organization_id', UUID(as_uuid=True), ForeignKey('organizations.id', ondelete='CASCADE')),
    Column('framework_id', UUID(as_uuid=True), ForeignKey('frameworks.id', ondelete='CASCADE')),
    ...
)

# Updated Framework model
class Framework(Base, TimestampMixin):
    # Removed: organization_id column
    
    # Updated relationship
    organizations = relationship(
        "Organization",
        secondary=organization_frameworks,
        back_populates="frameworks"
    )
```

### 2. Organization Model (`backend/app/models/identity.py`)
```python
class Organization(Base, TimestampMixin):
    # Updated relationship
    frameworks = relationship(
        "Framework",
        secondary="organization_frameworks",
        back_populates="organizations"
    )
```

### 3. API Endpoints (`backend/app/api/v1/frameworks.py`)
**Updated all endpoints to use junction table:**

- ✅ `GET /api/v1/frameworks/` - List frameworks
- ✅ `GET /api/v1/frameworks/stats` - Framework statistics
- ✅ `GET /api/v1/frameworks/regions` - Available regions
- ✅ `GET /api/v1/frameworks/{id}` - Get specific framework
- ✅ `POST /api/v1/frameworks/` - Create framework
- ✅ `PATCH /api/v1/frameworks/{id}` - Update framework
- ✅ `DELETE /api/v1/frameworks/{id}` - Delete framework

**Key Changes:**
- All queries now join with `organization_frameworks` table
- Framework creation now inserts into junction table
- Count queries optimized to avoid subquery issues
- Removed organization_id from request/response schemas

### 4. Schemas (`backend/app/schemas/compliance.py`)
```python
# FrameworkCreate - Removed organization_id field
class FrameworkCreate(FrameworkBase):
    # organization_id removed - determined from authenticated user
    framework_type: FrameworkType
    category: FrameworkCategory
    ...

# FrameworkResponse - Removed organization_id field
class FrameworkResponse(FrameworkBase):
    id: UUID
    # organization_id removed
    framework_type: FrameworkType
    ...
```

### 5. Seed Script (`backend/seed_all_frameworks.py`)
- Updated to check for existing frameworks via junction table
- Creates framework without organization_id
- Inserts association into organization_frameworks table

---

## 🧪 Testing Results

### All Endpoints Tested Successfully ✅

1. **List Frameworks** (`GET /api/v1/frameworks/`)
   - ✅ Returns frameworks for authenticated user's organization
   - ✅ Pagination works correctly
   - ✅ Filters work (type, category, region, mandatory, search)
   - ✅ Total count accurate (22 frameworks)

2. **Framework Statistics** (`GET /api/v1/frameworks/stats`)
   - ✅ Total: 22 frameworks
   - ✅ By type: 9 standards, 13 regulations
   - ✅ By category: Correct distribution
   - ✅ By region: 11 unique regions
   - ✅ Mandatory: 16, Optional: 6

3. **Get Framework** (`GET /api/v1/frameworks/{id}`)
   - ✅ Returns complete framework details
   - ✅ Respects organization access control

4. **Create Framework** (`POST /api/v1/frameworks/`)
   - ✅ Creates framework successfully
   - ✅ Automatically associates with user's organization
   - ✅ No organization_id required in request

5. **Update Framework** (`PATCH /api/v1/frameworks/{id}`)
   - ✅ Updates framework fields correctly
   - ✅ Maintains organization associations

6. **Delete Framework** (`DELETE /api/v1/frameworks/{id}`)
   - ✅ Deletes framework successfully
   - ✅ CASCADE removes junction table entries

---

## 📊 Database Verification

### Before Migration
```sql
SELECT COUNT(*) FROM frameworks WHERE organization_id IS NOT NULL;
-- Result: 22 frameworks
```

### After Migration
```sql
-- Junction table populated
SELECT COUNT(*) FROM organization_frameworks;
-- Result: 22 associations

-- organization_id column removed
SELECT organization_id FROM frameworks;
-- Result: ERROR - column does not exist ✅
```

---

## 🚀 Deployment

### Migration Applied
- **Migration File**: `remove_org_from_frameworks.py`
- **Revision**: `a1b2c3d4e5f6`
- **Applied To**: Supabase Production Database
- **Status**: ✅ Success

### Git Commits
1. **b3d2362** - "Convert Framework-Organization to Many-to-Many relationship"
   - Database migration
   - Model updates
   
2. **0ff5d09** - "Update API and schemas for Many-to-Many Framework-Organization relationship"
   - API endpoint updates
   - Schema updates
   - Seed script updates
   
3. **f6aaa33** - "Fix count query in frameworks list endpoint"
   - Query optimization
   - Fixed subquery issue

### GitHub
- ✅ All changes pushed to `main` branch
- ✅ Repository: https://github.com/Kiramido1/Amenly-Product

---

## 🎯 Benefits

### 1. **Flexibility**
- Frameworks can now be shared across multiple organizations
- Reduces data duplication for common frameworks (ISO 27001, GDPR, etc.)

### 2. **Scalability**
- Better database normalization
- Easier to manage framework updates globally

### 3. **Future Features**
- Framework marketplace/library
- Organization-specific framework customization
- Framework sharing between organizations

### 4. **Data Integrity**
- Proper Many-to-Many relationship structure
- CASCADE deletes maintain referential integrity
- Unique constraint prevents duplicate associations

---

## 📝 API Changes Summary

### Breaking Changes
- ❌ `organization_id` removed from `FrameworkCreate` schema
- ❌ `organization_id` removed from `FrameworkResponse` schema

### Backward Compatibility
- ✅ All existing API endpoints maintain same URLs
- ✅ Response structure unchanged (except organization_id removal)
- ✅ Authentication and authorization unchanged
- ✅ Filtering and pagination unchanged

### Migration Path for Clients
```javascript
// Before
const framework = {
  name: "ISO 27001",
  organization_id: "xxx-xxx-xxx",  // ❌ Remove this
  framework_type: "standard",
  ...
}

// After
const framework = {
  name: "ISO 27001",
  // organization_id automatically determined from auth token
  framework_type: "standard",
  ...
}
```

---

## 🔍 Verification Checklist

- [x] Database migration applied successfully
- [x] Junction table created with correct schema
- [x] Data migrated (22 frameworks → 22 associations)
- [x] organization_id column removed from frameworks table
- [x] Models updated (Framework, Organization)
- [x] API endpoints updated (all 7 endpoints)
- [x] Schemas updated (FrameworkCreate, FrameworkResponse)
- [x] Seed script updated
- [x] All endpoints tested and working
- [x] Changes committed to git
- [x] Changes pushed to GitHub
- [x] Backend restarted and verified
- [x] No errors in logs

---

## 📚 Related Files

### Modified Files
1. `backend/app/models/compliance.py`
2. `backend/app/models/identity.py`
3. `backend/app/api/v1/frameworks.py`
4. `backend/app/schemas/compliance.py`
5. `backend/seed_all_frameworks.py`

### New Files
1. `backend/alembic/versions/remove_org_from_frameworks.py`
2. `MANY_TO_MANY_MIGRATION_COMPLETE.md` (this file)

---

## 🎉 Conclusion

The Many-to-Many migration is **100% complete and tested**. All framework endpoints are working correctly with the new relationship structure. The system is ready for production use.

**Next Steps:**
- Consider implementing framework sharing features
- Add organization-specific framework customization
- Build framework marketplace/library

---

**Migration Date**: May 9, 2026  
**Completed By**: Kiro AI Assistant  
**Database**: Supabase PostgreSQL  
**Status**: ✅ Production Ready
