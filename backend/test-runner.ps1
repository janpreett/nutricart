# test-runner.ps1 - PowerShell script to run backend tests in different modes

param(
    [switch]$Local,
    [switch]$Docker,
    [switch]$Coverage,
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Verbose,
    [switch]$Help
)

# Colors for output
function Write-Status($message) {
    Write-Host "[INFO] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARN] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Help function
function Show-Help {
    Write-Host "NutriCart Backend Test Runner (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\test-runner.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Local           Run tests locally (requires virtual environment)"
    Write-Host "  -Docker          Run tests in Docker container"
    Write-Host "  -Coverage        Run tests with coverage report"
    Write-Host "  -Unit            Run only unit tests"
    Write-Host "  -Integration     Run only integration tests"
    Write-Host "  -Verbose         Run with verbose output"
    Write-Host "  -Help            Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\test-runner.ps1 -Local -Coverage"
    Write-Host "  .\test-runner.ps1 -Docker -Unit"
    Write-Host "  .\test-runner.ps1 -Local -Integration -Verbose"
}

# Show help if requested or no parameters
if ($Help -or (-not $Local -and -not $Docker)) {
    Show-Help
    exit 0
}

# Set test path based on type
$TestPath = "tests"
if ($Unit) {
    $TestPath = "tests/unit"
} elseif ($Integration) {
    $TestPath = "tests/integration"
}

# Build pytest arguments
$PytestArgs = @($TestPath)
if ($Verbose) {
    $PytestArgs += "-v"
}
if ($Coverage) {
    $PytestArgs += "--cov=app", "--cov-report=html", "--cov-report=term"
}

# Run tests based on mode
if ($Local) {
    Write-Status "Running tests locally..."
    
    # Check if virtual environment is activated
    if (-not $env:VIRTUAL_ENV) {
        Write-Warning "Virtual environment not detected. Attempting to activate..."
        
        if (Test-Path "venv\Scripts\Activate.ps1") {
            & "venv\Scripts\Activate.ps1"
            Write-Status "Virtual environment activated"
        } elseif (Test-Path "venv\Scripts\activate.bat") {
            & "venv\Scripts\activate.bat"
            Write-Status "Virtual environment activated"
        } else {
            Write-Error "Virtual environment not found. Please create one with: python -m venv venv"
            exit 1
        }
    }
    
    # Check if pytest is available
    try {
        python -c "import pytest" 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Installing test dependencies..."
            pip install -r requirements-test.txt
        }
    } catch {
        Write-Status "Installing test dependencies..."
        pip install -r requirements-test.txt
    }
    
    # Run tests
    Write-Status "Executing tests: $TestPath"
    python -m pytest @PytestArgs
    $TestResult = $LASTEXITCODE
    
} elseif ($Docker) {
    Write-Status "Running tests in Docker..."
    
    # Navigate to parent directory for docker-compose
    $CurrentDir = Get-Location
    Set-Location ..
    
    try {
        # Build test image if it doesn't exist
        $ImageExists = docker images nutricart-backend-test --format "table {{.Repository}}" | Select-String "nutricart-backend-test"
        if (-not $ImageExists) {
            Write-Status "Building test Docker image..."
            docker build -f backend/Dockerfile.test -t nutricart-backend-test backend/
        }
        
        # Determine which service to use
        $Service = "backend-test"
        if ($Coverage) {
            $Service = "backend-test-coverage"
        }
        
        # Set environment variable for pytest args
        $PytestArgsStr = $PytestArgs -join " "
        $env:PYTEST_ARGS = $PytestArgsStr
        
        # Run tests using docker-compose
        Write-Status "Executing tests: $TestPath"
        if ($Coverage) {
            docker-compose --profile test run --rm backend-test-coverage
        } else {
            docker-compose --profile test run --rm backend-test
        }
        $TestResult = $LASTEXITCODE
        
    } finally {
        # Return to original directory
        Set-Location $CurrentDir
    }
}

# Check test results
if ($TestResult -eq 0) {
    Write-Status "All tests passed! ✅"
    
    if ($Coverage) {
        Write-Status "Coverage report generated in htmlcov/index.html"
    }
} else {
    Write-Error "Some tests failed! ❌"
    exit 1
}
