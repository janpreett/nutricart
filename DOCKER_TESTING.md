# Docker Testing Guide for NutriCart Backend

### Run All Tests
```bash
# Using docker-compose (recommended)
docker-compose --profile test run --rm backend-test

# Using PowerShell on Windows
.\test-runner.ps1 -Docker

# Using bash script on Linux/macOS
./test-runner.sh --docker
```

### Run Tests with Coverage
```bash
# Using docker-compose
docker-compose --profile test run --rm backend-test-coverage

# Using PowerShell
.\test-runner.ps1 -Docker -Coverage

# Using bash script
./test-runner.sh --docker --coverage
```

## Docker Services

The docker-compose.yml includes several test-related services:

### backend-test
- **Purpose**: Run tests without coverage
- **Command**: `pytest tests --verbose`
- **Usage**: `docker-compose --profile test run --rm backend-test`

### backend-test-coverage
- **Purpose**: Run tests with coverage reporting
- **Command**: `pytest tests --cov=app --cov-report=html --cov-report=term --verbose`
- **Usage**: `docker-compose --profile test run --rm backend-test-coverage`

### Custom Test Commands

You can override the default pytest command using environment variables:

```bash
# Run only unit tests
PYTEST_ARGS="tests/unit -v" docker-compose --profile test run --rm backend-test

# Run with specific pytest options
PYTEST_ARGS="tests -v --tb=short" docker-compose --profile test run --rm backend-test

# Run with custom markers
PYTEST_ARGS="tests -v -m 'not slow'" docker-compose --profile test run --rm backend-test
```

### Interactive Testing

Start a test container with shell access for debugging:

```bash
# Start container with bash
docker-compose --profile test run --rm backend-test bash

# Inside the container, run specific tests
pytest tests/unit/test_auth.py -v -s
pytest tests/integration/ -v --tb=long
python -m pytest tests --pdb  # Debug mode
```

### Volume Mounts

The test services mount volumes for:
- **Source code**: `./backend:/app` - Live code updates
- **Coverage reports**: `test_coverage:/app/htmlcov` - Persistent coverage data

### Environment Variables

Test containers use these environment variables:
- `PYTHONPATH=/app` - Python module path
- `DATABASE_URL=sqlite:///./test.db` - Test database
- `PYTEST_ARGS` - Custom pytest arguments

## Docker Images

### Backend Test Image (Dockerfile.test)

The test image is based on `python:3.12-slim` and includes:
- System dependencies (gcc, libffi-dev, libssl-dev, curl)
- Python dependencies from `requirements.txt` and `requirements-test.txt`
- Test utilities (pytest, coverage, httpx)
- Health check endpoint

### Building the Test Image

```bash
# Build manually
docker build -f backend/Dockerfile.test -t nutricart-backend-test backend/

# Verify image
docker images nutricart-backend-test
```

### Update Dependencies

```bash
# Update test requirements
pip-compile requirements-test.in --upgrade

# Rebuild test image
docker build --no-cache -f backend/Dockerfile.test -t nutricart-backend-test backend/
```

### Clean Up

```bash
# Remove test containers and volumes
docker-compose --profile test down -v

# Remove test images
docker rmi nutricart-backend-test

# Clean up test artifacts
rm -rf backend/htmlcov backend/.coverage backend/test.db
```
