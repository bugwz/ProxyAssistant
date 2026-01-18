.PHONY: help test test_watch test_cov build build_chrome build_firefox clean package

# Variables
VERSION ?= dev
BUILD_DIR := build

# Default target
help:
	@echo "ProxyAssistant Build System"
	@echo ""
	@echo "Available commands:"
	@echo "  make test        - Run all tests"
	@echo "  make test_watch  - Run tests in watch mode"
	@echo "  make test_cov    - Run tests with coverage report"
	@echo "  make build       - Build Chrome and Firefox artifacts"
	@echo "  make build_chrome - Build Chrome only"
	@echo "  make build_firefox - Build Firefox only"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make help        - Show this help message"

# Test commands
test:
	@echo "Running tests..."
	npm test

test_watch:
	@echo "Running tests in watch mode..."
	npm run test:watch

test_cov:
	@echo "Running tests with coverage..."
	npm run test:coverage

# Build commands
build: clean
	@echo "Building ProxyAssistant v${VERSION}..."
	./script/build.sh ${VERSION}

build_chrome:
	@echo "Building Chrome artifact..."
	./script/build.sh ${VERSION}
	@echo "Chrome artifacts ready in ${BUILD_DIR}/"

build_firefox:
	@echo "Building Firefox artifact..."
	./script/build.sh ${VERSION}
	@echo "Firefox artifacts ready in ${BUILD_DIR}/"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf ${BUILD_DIR}

# Package commands
package: build
	@echo "Package created in ${BUILD_DIR}/"
	ls -lh ${BUILD_DIR}/ProxyAssistant_* 2>/dev/null || echo "No packages found"
