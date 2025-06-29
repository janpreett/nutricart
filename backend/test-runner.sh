#!/bin/bash
# test-runner.sh - Script to run backend tests in different modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    echo "NutriCart Backend Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --local           Run tests locally (requires virtual environment)"
    echo "  --docker          Run tests in Docker container"
    echo "  --coverage        Run tests with coverage report"
    echo "  --unit            Run only unit tests"
    echo "  --integration     Run only integration tests"
    echo "  --verbose         Run with verbose output"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --local --coverage"
    echo "  $0 --docker --unit"
    echo "  $0 --local --integration --verbose"
}

# Default values
MODE=""
TEST_TYPE="all"
VERBOSE=""
COVERAGE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            MODE="local"
            shift
            ;;
        --docker)
            MODE="docker"
            shift
            ;;
        --coverage)
            COVERAGE="--cov=app --cov-report=html --cov-report=term"
            shift
            ;;
        --unit)
            TEST_TYPE="unit"
            shift
            ;;
        --integration)
            TEST_TYPE="integration"
            shift
            ;;
        --verbose)
            VERBOSE="-v"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if mode is specified
if [ -z "$MODE" ]; then
    print_error "Please specify --local or --docker mode"
    show_help
    exit 1
fi

# Set test path based on type
case $TEST_TYPE in
    "unit")
        TEST_PATH="tests/unit"
        ;;
    "integration")
        TEST_PATH="tests/integration"
        ;;
    *)
        TEST_PATH="tests"
        ;;
esac

# Run tests based on mode
case $MODE in
    "local")
        print_status "Running tests locally..."
        
        # Check if virtual environment is activated
        if [ -z "$VIRTUAL_ENV" ]; then
            print_warning "Virtual environment not detected. Attempting to activate..."
            if [ -f "venv/bin/activate" ]; then
                source venv/bin/activate
                print_status "Virtual environment activated"
            elif [ -f "venv/Scripts/activate" ]; then
                source venv/Scripts/activate
                print_status "Virtual environment activated"
            else
                print_error "Virtual environment not found. Please create one with: python -m venv venv"
                exit 1
            fi
        fi
        
        # Install dependencies if needed
        if ! python -c "import pytest" 2>/dev/null; then
            print_status "Installing test dependencies..."
            pip install -r requirements-test.txt
        fi
        
        # Run tests
        print_status "Executing tests: $TEST_PATH"
        pytest $TEST_PATH $VERBOSE $COVERAGE
        ;;
        
    "docker")
        print_status "Running tests in Docker..."
        
        # Build test image if it doesn't exist
        if ! docker images | grep -q nutricart-backend-test; then
            print_status "Building test Docker image..."
            docker build -f Dockerfile.test -t nutricart-backend-test .
        fi
        
        # Run tests in container
        print_status "Executing tests: $TEST_PATH"
        docker run --rm -v "$(pwd):/app" nutricart-backend-test pytest $TEST_PATH $VERBOSE $COVERAGE
        ;;
esac

# Check test results
if [ $? -eq 0 ]; then
    print_status "All tests passed! ✅"
    
    if [ -n "$COVERAGE" ]; then
        print_status "Coverage report generated in htmlcov/index.html"
    fi
else
    print_error "Some tests failed! ❌"
    exit 1
fi
