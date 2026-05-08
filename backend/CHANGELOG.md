# Changelog

All notable changes to the Amenly Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-05-08

### Added
- 🎉 **Poetry Integration**: Complete migration to Poetry for dependency management
- 📝 **Professional Makefile**: Comprehensive make commands for all development tasks
- 🔧 **Pre-commit Hooks**: Automated code quality checks before commits
- 📊 **Structured Logging**: Professional logging with structlog
- 🐳 **Optimized Docker**: Multi-stage Docker build with non-root user
- 🧪 **Enhanced Testing**: Pytest configuration with coverage reports
- 🎨 **Code Formatting**: Black, isort, and ruff integration
- 📚 **Comprehensive Documentation**: Updated README with all commands and workflows

### Changed
- ⚡ **Dependency Management**: Migrated from requirements.txt to pyproject.toml
- 🏗️ **Build System**: Using Poetry for all dependency operations
- 📦 **Virtual Environment**: Local .venv in project directory
- 🔐 **Security**: Enhanced Docker security with non-root user

### Fixed
- 🐛 **pgbouncer Compatibility**: Fixed prepared statement issues with psycopg3
- 🔒 **Token Revocation**: Complete Redis-based token revocation system
- 🧹 **Code Quality**: Fixed linting issues and improved code structure

### Removed
- 🗑️ **requirements.txt**: Replaced with Poetry's pyproject.toml
- 🗑️ **Manual Dependency Management**: Automated with Poetry

## [1.0.0] - 2026-05-07

### Added
- 🎉 Initial release
- 🔐 JWT Authentication with Redis token revocation
- 📊 Risk Assessment endpoints
- 📋 Compliance Management
- 🤖 AI Integration with Ollama
- 🔄 Real-time WebSocket support
- 🏢 Multi-tenancy support
- 📈 Analytics & Reporting

### Security
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ CORS protection
- ✅ SQL injection prevention

---

## Version History

- **1.0.1** - Poetry migration and professional tooling
- **1.0.0** - Initial release with core features
