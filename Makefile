# Makefile for NutriCart Backend Testing

.PHONY: help test test-local test-docker test-coverage test-unit test-integration clean

# Default target
help:
	@echo "NutriCart Backend Test Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  test           - Run all tests in Docker (default)"
	@echo "  test-local     - Run tests locally"
	@echo "  test-docker    - Run tests in Docker"
	@echo "  test-coverage  - Run tests with coverage in Docker"
	@echo "  test-unit      - Run only unit tests in Docker"
	@echo "  test-integration - Run only integration tests in Docker"
	@echo "  build-test     - Build the test Docker image"
	@echo "  clean          - Clean up test artifacts"
	@echo ""
	@echo "Examples:"
	@echo "  make test"
	@echo "  make test-coverage"
	@echo "  make test-unit"

# Default test target
test: test-docker

# Local testing
test-local:
	@echo "Running tests locally..."
	cd backend && python -m pytest tests -v

test-local-coverage:
	@echo "Running tests locally with coverage..."
	cd backend && python -m pytest tests --cov=app --cov-report=html --cov-report=term -v

# Docker testing
test-docker:
	@echo "Running tests in Docker..."
	docker-compose --profile test run --rm backend-test

test-coverage:
	@echo "Running tests with coverage in Docker..."
	docker-compose --profile test run --rm backend-test-coverage

test-unit:
	@echo "Running unit tests in Docker..."
	PYTEST_ARGS="tests/unit -v" docker-compose --profile test run --rm backend-test

test-integration:
	@echo "Running integration tests in Docker..."
	PYTEST_ARGS="tests/integration -v" docker-compose --profile test run --rm backend-test

test-parallel:
	@echo "Running tests in parallel in Docker..."
	PYTEST_ARGS="tests -v -n auto" docker-compose --profile test run --rm backend-test

# Build test image
build-test:
	@echo "Building test Docker image..."
	docker build -f backend/Dockerfile.test -t nutricart-backend-test backend/

# Interactive testing
test-shell:
	@echo "Starting interactive test container..."
	docker-compose --profile test run --rm backend-test bash

# Clean up
clean:
	@echo "Cleaning up test artifacts..."
	rm -rf backend/htmlcov backend/.coverage backend/test.db backend/.pytest_cache
	docker system prune -f --filter="label=test"

# Development targets
dev-setup:
	@echo "Setting up development environment..."
	cd backend && python -m venv venv
	@echo "Activate virtual environment with:"
	@echo "  source backend/venv/bin/activate  # Linux/macOS"
	@echo "  backend\\venv\\Scripts\\activate  # Windows"

dev-install:
	@echo "Installing development dependencies..."
	cd backend && pip install -r requirements.txt -r requirements-test.txt
