# Contributing to Amenly Backend

Thank you for your interest in contributing to Amenly! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Poetry (will be installed automatically)
- Git
- Docker (optional, for testing)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/Kiramido1/Amenly-Product.git
cd Amenly-Product/backend

# Complete setup (installs dependencies, pre-commit hooks, runs migrations)
make setup

# Start development server
make dev
```

## 📋 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 3. Run Quality Checks

```bash
# Format code
make format

# Run linting
make lint

# Run tests
make test

# Or run all checks at once
make check
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug in authentication"
# or
git commit -m "docs: update API documentation"
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 🎨 Code Style

### Python Style Guide

We follow PEP 8 with some modifications:

- **Line Length**: 100 characters (enforced by Black)
- **Imports**: Sorted with isort
- **Type Hints**: Use type hints where appropriate
- **Docstrings**: Google-style docstrings

### Formatting Tools

All formatting is automated:

```bash
# Format code
make format

# Check formatting
make format-check
```

### Linting

```bash
# Run all linters
make lint

# Individual linters
poetry run ruff check app tests
poetry run flake8 app tests
poetry run mypy app
```

## 🧪 Testing

### Writing Tests

- Place tests in the `tests/` directory
- Mirror the structure of the `app/` directory
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

Example:

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_user_registration(client: AsyncClient):
    # Arrange
    user_data = {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User"
    }
    
    # Act
    response = await client.post("/api/v1/auth/register", json=user_data)
    
    # Assert
    assert response.status_code == 201
    assert response.json()["success"] is True
```

### Running Tests

```bash
# All tests
make test

# Unit tests only
make test-unit

# Integration tests only
make test-integration

# Specific test file
poetry run pytest tests/auth/test_login.py -v

# With coverage
poetry run pytest --cov=app --cov-report=html
```

### Test Markers

Use pytest markers to categorize tests:

```python
@pytest.mark.unit
def test_password_hashing():
    ...

@pytest.mark.integration
async def test_database_connection():
    ...

@pytest.mark.slow
async def test_large_dataset():
    ...
```

## 📝 Documentation

### Code Documentation

- Add docstrings to all public functions, classes, and modules
- Use Google-style docstrings
- Include type hints

Example:

```python
def calculate_risk_score(
    vulnerabilities: list[Vulnerability],
    severity_weights: dict[str, float]
) -> float:
    """
    Calculate the overall risk score based on vulnerabilities.
    
    Args:
        vulnerabilities: List of vulnerability objects
        severity_weights: Dictionary mapping severity levels to weights
        
    Returns:
        Calculated risk score between 0 and 100
        
    Raises:
        ValueError: If severity_weights is empty
    """
    ...
```

### API Documentation

- FastAPI automatically generates OpenAPI documentation
- Add descriptions to endpoints using docstrings
- Document request/response models with Pydantic

Example:

```python
@router.post("/assessments", response_model=AssessmentResponse)
async def create_assessment(
    assessment: AssessmentCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new security assessment.
    
    This endpoint allows authenticated users to create a new security
    assessment for their organization.
    
    - **name**: Assessment name (required)
    - **framework**: Compliance framework (ISO 27001, SOC 2, etc.)
    - **scope**: Assessment scope description
    """
    ...
```

## 🔧 Database Migrations

### Creating Migrations

```bash
# Create a new migration
make makemigrations

# Apply migrations
make migrate

# Rollback last migration
make downgrade
```

### Migration Guidelines

- One migration per logical change
- Use descriptive migration messages
- Test migrations both up and down
- Never edit existing migrations in production

## 🐛 Reporting Bugs

### Before Submitting

1. Check if the bug has already been reported
2. Verify it's reproducible
3. Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Python version: [e.g., 3.12.0]
- Poetry version: [e.g., 1.8.0]

**Additional context**
Any other relevant information.
```

## 💡 Feature Requests

### Before Submitting

1. Check if the feature has already been requested
2. Consider if it aligns with project goals
3. Think about implementation details

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots.
```

## 📊 Code Review Process

### What We Look For

- ✅ Code quality and readability
- ✅ Test coverage
- ✅ Documentation
- ✅ Performance implications
- ✅ Security considerations
- ✅ Backward compatibility

### Review Timeline

- Initial review within 2-3 business days
- Follow-up reviews within 1-2 business days
- Merge after approval from at least one maintainer

## 🎯 Best Practices

### General

- Keep changes focused and atomic
- Write self-documenting code
- Avoid premature optimization
- Follow SOLID principles
- Use meaningful variable names

### Security

- Never commit secrets or credentials
- Validate all user inputs
- Use parameterized queries
- Follow OWASP guidelines
- Keep dependencies updated

### Performance

- Use async/await for I/O operations
- Implement caching where appropriate
- Optimize database queries
- Profile before optimizing

## 📞 Getting Help

- **Documentation**: Check the README and docs/
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: team@amenly.com

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project (Proprietary).

---

Thank you for contributing to Amenly! 🎉
