# NutriCart Backend Test Documentation

Backend API tests for the NutriCart FastAPI application.

## Tests Included

### Unit Tests
- **Authentication Functions**: Tests for password hashing, JWT token
- **Database Models**: Tests for User, Profile, and Contact model

### Integration Tests  
- **Complete API Flows**: End-to-end tests for user registration, login, profile, and contact submission
- **Database Integration**: Tests that verify API endpoints work correctly with the database

### Basic API Tests
- **Root Endpoint**: Checks if the backend is running and returns the welcome message
- **User Registration & Login**: Verifies that a user can register and then log in to receive a JWT token

### Test Scripts

The project includes convenient test runner scripts for both Windows and Unix systems:

#### test-runner.ps1 (Windows PowerShell)
```powershell
# Show help
.\test-runner.ps1 -Help

# Local testing
.\test-runner.ps1 -Local -Verbose
.\test-runner.ps1 -Local -Coverage -Unit

# Docker testing  
.\test-runner.ps1 -Docker -Integration
.\test-runner.ps1 -Docker -Coverage -Verbose
```

#### test-runner.sh (Linux/macOS Bash)
```bash
# Show help
./test-runner.sh --help

# Local testing
./test-runner.sh --local --verbose
./test-runner.sh --local --coverage --unit

# Docker testing
./test-runner.sh --docker --integration
./test-runner.sh --docker --coverage --verbose
```

## Running Tests Locally

### Prerequisites
- Python 3.12+
- Virtual environment (recommended)

### Setup and Run
1. **Set up virtual environment:**
   ```sh
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   pip install pytest pytest-asyncio httpx
   ```
3. **Run all tests:**
   ```sh
   pytest tests -v
   ```
4. **Run specific test categories:**
   ```sh
   pytest tests/unit          # Unit tests only
   pytest tests/integration   # Integration tests only
   pytest tests/test_main.py  # Basic API tests only
   ```
5. **Run tests with coverage:**
   ```sh
   pip install pytest-cov
   pytest tests --cov=app --cov-report=html
   ```

## Running Tests with Docker

### Using Docker Compose (Recommended)

1. **Run all tests:**
   ```bash
   docker-compose --profile test run --rm backend-test
   ```

2. **Run tests with coverage:**
   ```bash
   docker-compose --profile test run --rm backend-test-coverage
   ```

3. **Run specific test types:**
   ```bash
   # Unit tests only
   PYTEST_ARGS="tests/unit -v" docker-compose --profile test run --rm backend-test
   
   # Integration tests only
   PYTEST_ARGS="tests/integration -v" docker-compose --profile test run --rm backend-test
   ```

4. **Run tests in parallel (faster):**
   ```bash
   PYTEST_ARGS="tests -v -n auto" docker-compose --profile test run --rm backend-test
   ```

### Using Test Runner Scripts

#### Windows (PowerShell)
```powershell
# Run all tests in Docker
.\test-runner.ps1 -Docker

# Run with coverage
.\test-runner.ps1 -Docker -Coverage

# Run only unit tests
.\test-runner.ps1 -Docker -Unit -Verbose
```

#### Linux/macOS (Bash)
```bash
# Run all tests in Docker
./test-runner.sh --docker

# Run with coverage
./test-runner.sh --docker --coverage

# Run only integration tests
./test-runner.sh --docker --integration --verbose
```

### Using Docker Build
1. **Build the test image:**
   ```bash
   docker build -f backend/Dockerfile.test -t nutricart-backend-test backend/
   ```
2. **Run tests:**
   ```bash
   docker run --rm -v "$(pwd)/backend:/app" nutricart-backend-test pytest tests -v
   ```

### Interactive Testing
1. **Start a test container with shell access:**
   ```bash
   docker-compose --profile test run --rm backend-test bash
   ```
2. **Inside the container, run specific tests:**
   ```bash
   pytest tests/unit/test_auth.py -v
   pytest tests/integration/ -v --tb=long
   python -m pytest tests --pdb  # Debug mode
   ```

## Test Configuration

The test suite uses:
- **pytest** as the test runner
- **FastAPI TestClient** for API endpoint testing
- **SQLAlchemy** with in-memory SQLite for database testing
- **Test fixtures** for database setup and teardown
- **Dependency injection** for test database isolation

### Test Database
- Tests use an isolated SQLite database (`test.db`)
- Database is created fresh for each test session
- Fixtures ensure proper cleanup between tests

### Environment Variables
Tests can be configured with:
- `DATABASE_URL`: Test database connection string
- `PYTHONPATH`: Python module path (set to `/app` in Docker)

### Debug Mode
Run tests with debug output:
```sh
pytest tests -v -s --tb=long
```

## Test Coverage

Current test coverage includes:
- ✅ Authentication flow (register, login, JWT)
- ✅ User profile management
- ✅ Contact form submission
- ✅ Database model validation
- ✅ API endpoint responses
- ✅ Error handling
