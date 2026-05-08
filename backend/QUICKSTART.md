# 🚀 Quick Start Guide - Amenly Backend

Get up and running with Amenly Backend in 5 minutes!

## ⚡ Super Quick Start

```bash
cd backend
make run
```

That's it! The backend will:
1. ✅ Install Poetry (if needed)
2. ✅ Install all dependencies
3. ✅ Start the server at http://localhost:8000

## 📋 Step-by-Step Guide

### 1. Prerequisites

Make sure you have:
- ✅ Python 3.12+ installed
- ✅ Git installed
- ✅ Terminal/Command Line access

### 2. Clone & Navigate

```bash
git clone https://github.com/Kiramido1/Amenly-Product.git
cd Amenly-Product/backend
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (optional for local development)
nano .env  # or use your favorite editor
```

### 4. Run the Backend

```bash
make run
```

The first run will take a few minutes to install dependencies.

### 5. Verify It's Working

Open your browser and visit:
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You should see:
```json
{
  "status": "healthy",
  "timestamp": 1778244572.123,
  "version": "1.0.1"
}
```

## 🎯 Common Tasks

### Development Mode (with hot reload)

```bash
make dev
```

Changes to code will automatically reload the server.

### Run Tests

```bash
make test
```

### Format Code

```bash
make format
```

### Check Code Quality

```bash
make check
```

### Database Migrations

```bash
# Apply migrations
make migrate

# Create new migration
make makemigrations
```

### View All Commands

```bash
make help
```

## 🐳 Using Docker

If you prefer Docker:

```bash
# Build and start all services
make docker

# View logs
make logs

# Stop services
make down
```

## 🔧 Troubleshooting

### "Poetry not found"

The Makefile will automatically install Poetry. If it fails:

```bash
curl -sSL https://install.python-poetry.org | python3 -
export PATH="$HOME/.local/bin:$PATH"
```

### "Port 8000 already in use"

```bash
# Find and kill the process
lsof -i :8000
kill -9 <PID>

# Or use a different port
poetry run uvicorn app.main:app --port 8001
```

### "Database connection error"

Make sure your `.env` file has correct database credentials:

```env
DATABASE_URL=postgresql+psycopg://user:pass@host:6543/db
```

### "Module not found"

```bash
# Reinstall dependencies
rm -rf .venv
make install-dev
```

## 📚 Next Steps

1. **Read the Full README**: `README.md`
2. **Explore API Docs**: http://localhost:8000/docs
3. **Check Contributing Guide**: `CONTRIBUTING.md`
4. **Review Code Structure**: See `README.md` for project structure

## 💡 Pro Tips

### Use Development Mode

```bash
make dev  # Auto-reloads on code changes
```

### Install Pre-commit Hooks

```bash
make pre-commit-install
```

This will automatically format and check your code before each commit.

### Use the Python Shell

```bash
make shell
```

Opens an IPython shell with your app context loaded.

### Check Health

```bash
make health
```

Quickly check if the backend is running.

## 🎓 Learning Resources

- **FastAPI Tutorial**: https://fastapi.tiangolo.com/tutorial/
- **Poetry Docs**: https://python-poetry.org/docs/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/

## 🆘 Need Help?

- **Documentation**: Check `README.md` and `CONTRIBUTING.md`
- **Issues**: https://github.com/Kiramido1/Amenly-Product/issues
- **Email**: team@amenly.com

---

**Happy Coding! 🎉**
