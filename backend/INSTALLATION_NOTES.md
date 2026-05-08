# 📦 Installation Notes

## ⏱️ First Time Installation

When you run `make run` for the first time, Poetry will:

1. ✅ Check if Poetry is installed (installs if needed)
2. ✅ Create a virtual environment in `.venv/`
3. ✅ Install all dependencies from `poetry.lock`
4. ✅ Start the backend server

**⚠️ Note:** The first installation takes **5-10 minutes** because:
- Poetry needs to download all packages
- Some packages (like `numpy`, `psycopg`) need to build binary wheels
- This is **normal** and only happens once!

## 🚀 What's Happening Now

You're seeing:
```
Installing numpy (1.26.4): Building a wheel file for numpy...
```

This means Poetry is:
- ✅ Downloading numpy
- ✅ Building it for your system (Python 3.13 on Linux)
- ✅ This takes 2-5 minutes

**Just wait!** ☕ The installation will complete automatically.

## ⚡ After First Installation

Once installed, subsequent runs are **instant**:

```bash
make run    # Starts immediately (< 5 seconds)
make dev    # Starts immediately with hot reload
```

## 📊 Installation Progress

You can monitor the installation in another terminal:

```bash
# Check Poetry process
ps aux | grep poetry

# Check virtual environment
ls -la .venv/

# Check installed packages
poetry show
```

## 🔍 Verify Installation

After installation completes, verify everything:

```bash
# Check installation
./scripts/check_installation.sh

# Or manually
poetry show                    # List installed packages
poetry env info                # Show environment info
make health                    # Check backend health
```

## 🐛 If Installation Hangs

If installation seems stuck (> 15 minutes):

```bash
# 1. Cancel the current installation
Ctrl+C

# 2. Clean up
make clean
rm -rf .venv

# 3. Try again with verbose output
poetry install -vvv

# 4. Or install without building from source
poetry install --no-binary :all:
```

## 💡 Speed Up Future Installations

### Option 1: Use Pre-built Wheels

```bash
# Install with pre-built wheels (faster)
poetry config installer.max-workers 10
poetry install
```

### Option 2: Use System Python Packages

```bash
# Use system site-packages (if available)
poetry config virtualenvs.options.system-site-packages true
```

### Option 3: Cache Dependencies

Poetry automatically caches downloads in:
- Linux: `~/.cache/pypoetry/`
- macOS: `~/Library/Caches/pypoetry/`

## 📦 What Gets Installed

### Main Dependencies (22 packages)
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **SQLAlchemy** - Database ORM
- **Psycopg** - PostgreSQL driver
- **Redis** - Caching
- **Pydantic** - Data validation
- **Alembic** - Database migrations
- **Python-Jose** - JWT tokens
- **Passlib** - Password hashing
- **Structlog** - Logging
- **Langchain** - AI integration
- **Qdrant-client** - Vector DB
- **OpenAI** - AI models
- And more...

### Dev Dependencies (13 packages)
- **Pytest** - Testing
- **Black** - Code formatting
- **Isort** - Import sorting
- **Ruff** - Linting
- **Mypy** - Type checking
- **Pre-commit** - Git hooks
- And more...

## 🎯 Expected Installation Time

| Component | Time | Status |
|-----------|------|--------|
| Poetry setup | 10s | ✅ |
| Create venv | 5s | ✅ |
| Download packages | 1-2min | ⏳ |
| Build numpy | 2-3min | ⏳ Current |
| Build psycopg | 1min | ⏳ |
| Install remaining | 1-2min | ⏳ |
| **Total** | **5-10min** | ⏳ |

## ✅ Installation Complete When You See

```
✓ Dependencies installed successfully
Starting Amenly Backend Server...
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 🌐 Access the Backend

Once running:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## 📞 Need Help?

If installation fails:

1. **Check Python version**: `python3 --version` (need 3.12+)
2. **Check disk space**: `df -h`
3. **Check logs**: Look for error messages
4. **Clean and retry**: `make clean && make install`
5. **Ask for help**: Open an issue on GitHub

## 🎉 Success Indicators

You'll know installation succeeded when:
- ✅ `.venv/` directory exists
- ✅ `poetry show` lists all packages
- ✅ `make health` returns healthy status
- ✅ Server starts without errors

---

**Be patient! The first installation takes time but it's worth it!** ☕

After this, everything will be **instant**! ⚡
