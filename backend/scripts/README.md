# 🛠️ Backend Scripts

Utility scripts for Amenly Backend development and maintenance.

## Available Scripts

### check_installation.sh

Checks the installation status of all required components.

**Usage:**
```bash
./scripts/check_installation.sh
# or
make check-install
```

**Checks:**
- ✅ Python version
- ✅ Poetry installation
- ✅ Virtual environment
- ✅ Dependencies
- ✅ Environment configuration
- ✅ Docker (optional)

**Output:**
```
🔍 Checking Amenly Backend Installation...

1. Python Version:
Python 3.12.0
✓ Python is installed

2. Poetry:
Poetry (version 2.4.0)
✓ Poetry is installed

3. Virtual Environment:
✓ Virtual environment exists

4. Dependencies:
✓ poetry.lock exists
✓ Dependencies are installed

5. Environment Configuration:
✓ .env file exists

6. Docker (optional):
Docker version 24.0.0
✓ Docker is installed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Installation check complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Adding New Scripts

To add a new script:

1. Create the script in this directory
2. Make it executable: `chmod +x scripts/your_script.sh`
3. Add documentation here
4. (Optional) Add a Makefile command

Example:

```bash
#!/bin/bash
# scripts/your_script.sh

echo "Your script here"
```

```makefile
# In Makefile
your-command: ## Description
	@./scripts/your_script.sh
```

## Script Guidelines

- Use bash for shell scripts
- Add shebang: `#!/bin/bash`
- Use colors for output (see check_installation.sh)
- Add error handling
- Make scripts idempotent
- Document usage

## Color Codes

```bash
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
```

## Common Patterns

### Check if command exists

```bash
if command -v poetry &> /dev/null; then
    echo "Poetry is installed"
else
    echo "Poetry is not installed"
fi
```

### Check if file exists

```bash
if [ -f ".env" ]; then
    echo ".env exists"
else
    echo ".env not found"
fi
```

### Check if directory exists

```bash
if [ -d ".venv" ]; then
    echo "Virtual environment exists"
else
    echo "Virtual environment not found"
fi
```

---

**Need help?** Check the main README.md or open an issue.
