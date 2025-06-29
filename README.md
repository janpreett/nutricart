# Nutricart
Capstone Project

## Branch Structure

This repository uses a two-feature-branch system to separate the frontend and backend development:

- `feat/init-frontend`: Contains the frontend codebase (React + Tailwind CSS)
- `feat/init-backend`: Contains the backend codebase (FastAPI)

### Workflow

- Each branch is independent and can be:
  - Built
  - Tested
  - Reviewed

- Once both branches are ready, they will be merged into the main branch for production.

### Start both backend and frontend services using Docker
```bash
docker-compose up
```

### Stop services using Docker
```bash
docker-compose down
```

### Run tests
```bash
# Run backend tests locally
cd backend && pytest tests -v

# Run backend tests in Docker
docker-compose --profile test run --rm backend-test

# Run tests with coverage
docker-compose --profile test run --rm backend-test-coverage
```

## Backend Documentation

- **[Backend Testing Guide](backend/tests/README.md)** - Testing documentation
- **[Docker Testing Guide](DOCKER_TESTING.md)** - Docker-specific testing instructions
- **[API Documentation](backend/README.md)** - Backend API documentation
