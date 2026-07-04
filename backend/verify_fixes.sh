#!/bin/bash

# Verification script for bug fixes
# Run this to verify all fixes are working

echo "================================================================================"
echo "VERIFICATION SCRIPT - Bug Fixes and Tests"
echo "================================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Database Migration
echo "1. Checking database migration status..."
MIGRATION=$(poetry run alembic current 2>&1 | grep "dfdc0978922d")
if [ -n "$MIGRATION" ]; then
    echo -e "${GREEN}✓ Migration applied: dfdc0978922d${NC}"
else
    echo -e "${RED}✗ Migration not applied${NC}"
    exit 1
fi
echo ""

# Check 2: Verify trigger is gone
echo "2. Checking for obsolete triggers..."
TRIGGER_COUNT=$(poetry run python -c "
import asyncio
from sqlalchemy import text
from app.database.session import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text('''
            SELECT COUNT(*) FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND trigger_name LIKE '%question%'
        '''))
        print(result.scalar())

asyncio.run(check())
" 2>/dev/null)

if [ "$TRIGGER_COUNT" = "0" ]; then
    echo -e "${GREEN}✓ No obsolete triggers found${NC}"
else
    echo -e "${RED}✗ Found $TRIGGER_COUNT obsolete triggers${NC}"
    exit 1
fi
echo ""

# Check 3: Verify import fix
echo "3. Checking auth service imports..."
if grep -q "from sqlalchemy import text, select" app/auth/service.py; then
    echo -e "${GREEN}✓ Import fix verified${NC}"
else
    echo -e "${RED}✗ Import fix not found${NC}"
    exit 1
fi
echo ""

# Check 4: Run authentication tests
echo "4. Running authentication tests..."
echo ""
TEST_OUTPUT=$(poetry run python test_auth_simple.py 2>&1)
if echo "$TEST_OUTPUT" | grep -q "ALL TESTS PASSED"; then
    echo -e "${GREEN}✓ All authentication tests passed${NC}"
    echo ""
    echo "$TEST_OUTPUT" | grep "✓"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo "$TEST_OUTPUT"
    exit 1
fi
echo ""

# Summary
echo "================================================================================"
echo -e "${GREEN}✓ ALL VERIFICATIONS PASSED${NC}"
echo "================================================================================"
echo ""
echo "Summary:"
echo "  ✓ Database migration applied"
echo "  ✓ Obsolete triggers removed"
echo "  ✓ Import fixes verified"
echo "  ✓ Authentication tests passing"
echo ""
echo "System is ready for use!"
echo ""

exit 0
