import asyncio
import asyncpg
from urllib.parse import quote_plus

async def test_conn():
    user = "postgres.ysoqassxwmgvusvzzefh"
    password = "Amenly-GRC@"
    encoded_password = quote_plus(password)
    
    # Try different hosts
    hosts = [
        "aws-0-eu-west-1.pooler.supabase.com",
        "aws-0-eu-central-1.pooler.supabase.com",
        "db.ysoqassxwmgvusvzzefh.supabase.co"
    ]
    
    for host in hosts:
        print(f"Testing {host}...")
        url = f"postgresql://{user}:{encoded_password}@{host}:6543/postgres"
        try:
            conn = await asyncio.wait_for(asyncpg.connect(url), timeout=5)
            print(f"SUCCESS connecting to {host}!")
            await conn.close()
            return host
        except Exception as e:
            print(f"FAILED {host}: {e}")
    
    return None

if __name__ == "__main__":
    asyncio.run(test_conn())
