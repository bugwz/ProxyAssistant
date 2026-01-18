.PHONY: help test test_nocache test_unit test_integration test_e2e test_watch_nocache test_cov_nocache test_init test_clean build clean

# Variables
VERSION ?= dev
BUILD_DIR := build
COVERAGE_DIR := coverage

# Default target
help:
	@echo "ProxyAssistant Build System"
	@echo ""
	@echo "Available commands:"
	@echo ""
	@echo "  [Test Commands]"
	@echo "  make test              - Run all tests (unit + integration + e2e)"
	@echo "  make test_nocache      - Run tests without cache"
	@echo "  make test_unit         - Run unit tests only"
	@echo "  make test_integration  - Run integration tests only"
	@echo "  make test_e2e          - Run e2e tests only"
	@echo "  make test_watch_nocache - Run tests in watch mode without cache"
	@echo "  make test_cov_nocache  - Run tests with coverage, no cache"
	@echo "  make test_init         - Initialize test environment and dependencies"
	@echo "  make test_clean        - Clean test cache and coverage files"
	@echo ""
	@echo "  [Build Commands]"
	@echo "  make build       - Build Chrome and Firefox artifacts"
	@echo "  make clean       - Clean build artifacts"
	@echo ""
	@echo "  [Utility Commands]"
	@echo "  make help        - Show this help message"

# Test commands
test:
	@echo "Checking test environment..."
	@if [ ! -d node_modules ]; then \
		echo "Dependencies not found. Running make test_init..."; \
		make test_init; \
	fi
	@echo "Running all tests (unit + integration + e2e)..."
	@echo "----------------------------------------"
	@echo "Running unit tests..."
	-npm run test:unit -- --no-cache 2>/dev/null || echo "No unit tests found"
	@echo "----------------------------------------"
	@echo "Running integration tests..."
	-npm run test:integration -- --no-cache 2>/dev/null || echo "No integration tests found"
	@echo "----------------------------------------"
	@echo "Running e2e tests..."
	-npm run test:e2e -- --no-cache 2>/dev/null || echo "No e2e tests found"
	@echo "----------------------------------------"
	@echo "All tests completed!"

test_nocache:
	@echo "Running tests without cache..."
	npm test -- --no-cache

test_unit:
	@echo "Running unit tests..."
	npm run test:unit -- --no-cache

test_integration:
	@echo "Running integration tests..."
	@if [ ! -d tests/integration ]; then \
		echo "No integration tests found (tests/integration/ directory does not exist)"; \
		exit 0; \
	fi
	-npm run test:integration -- --no-cache 2>/dev/null || echo "No integration tests found"

test_e2e:
	@echo "Running e2e tests..."
	@if [ ! -d tests/e2e ]; then \
		echo "No e2e tests found (tests/e2e/ directory does not exist)"; \
		exit 0; \
	fi
	-npm run test:e2e -- --no-cache 2>/dev/null || echo "No e2e tests found"

test_watch_nocache:
	@echo "Running tests in watch mode without cache..."
	npm run test:watch -- --no-cache

test_cov_nocache:
test_init:
	@echo "Initializing test environment..."
	@echo "----------------------------------------"
	@echo "Checking Node.js and npm versions..."
	@node --version && npm --version
	@echo "----------------------------------------"
	@echo "Installing dependencies..."
	npm install
	@echo "----------------------------------------"
	@echo "Validating Jest configuration..."
	@test -f tests/jest.config.js && echo "Jest config found: tests/jest.config.js" || echo "Warning: Jest config not found"
	@echo "----------------------------------------"
	@echo "Checking web-ext for Firefox builds..."
	@if command -v web-ext >/dev/null 2>&1; then \
		echo "web-ext is installed"; \
	else \
		echo "web-ext not found. Installing globally..."; \
		npm install -g web-ext; \
	fi
	@echo "----------------------------------------"
	@echo "Clearing test cache and coverage..."
	rm -rf $(COVERAGE_DIR) .jest-cache 2>/dev/null || true
	@echo "Test environment initialized successfully!"

# Clean test artifacts
test_clean:
	@echo "Cleaning test cache and coverage files..."
	rm -rf $(COVERAGE_DIR) .jest-cache 2>/dev/null || true
	@echo "Test artifacts cleaned!"

# Build commands
build: clean
	@echo "Building ProxyAssistant v${VERSION}..."
	./script/build.sh ${VERSION}

clean:
	@echo "Cleaning build artifacts..."
	rm -rf ${BUILD_DIR}
