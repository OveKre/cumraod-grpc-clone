#!/bin/bash

echo "Running gRPC Server Tests..."

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test and check result
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✓ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL: $test_name${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check if server is running
check_server() {
    local server_host=${GRPC_HOST:-"localhost"}
    local server_port=${GRPC_PORT:-"50051"}
    
    # Simple connection test using netcat or telnet
    if command -v nc &> /dev/null; then
        echo "quit" | nc -w 1 "$server_host" "$server_port" &> /dev/null
    elif command -v telnet &> /dev/null; then
        timeout 1 telnet "$server_host" "$server_port" &> /dev/null
    else
        # Fallback: try to connect using Node.js
        node -e "
        const net = require('net');
        const client = net.createConnection($server_port, '$server_host', () => {
            console.log('Connected');
            client.end();
            process.exit(0);
        });
        client.on('error', () => {
            process.exit(1);
        });
        setTimeout(() => process.exit(1), 1000);
        " &> /dev/null
    fi
}

# Start server in background if not running
start_test_server() {
    if ! check_server; then
        echo "Starting test server..."
        npm start &
        SERVER_PID=$!
        
        # Wait for server to start
        for i in {1..10}; do
            if check_server; then
                echo "Server started successfully"
                return 0
            fi
            echo "Waiting for server to start... ($i/10)"
            sleep 2
        done
        
        echo "Failed to start server"
        return 1
    else
        echo "Server is already running"
        return 0
    fi
}

# Stop test server
stop_test_server() {
    if [ ! -z "$SERVER_PID" ]; then
        echo "Stopping test server..."
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
    fi
}

# Proto compilation test
test_proto_compilation() {
    if command -v protoc &> /dev/null; then
        local proto_errors=0
        for proto_file in proto/*.proto; do
            if [ -f "$proto_file" ]; then
                if ! protoc --js_out=/tmp "$proto_file" 2>/dev/null; then
                    echo "Proto compilation failed for $proto_file"
                    ((proto_errors++))
                fi
            fi
        done
        return $proto_errors
    else
        echo "protoc not available, skipping proto compilation test"
        return 0
    fi
}

# Test client functionality
test_client_functionality() {
    timeout 30 node client/example.js > /tmp/client_test.log 2>&1
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        if grep -q "Demo Completed Successfully" /tmp/client_test.log; then
            return 0
        else
            echo "Client did not complete successfully"
            cat /tmp/client_test.log
            return 1
        fi
    else
        echo "Client test failed with exit code $exit_code"
        cat /tmp/client_test.log
        return 1
    fi
}

# Test individual RPC calls
test_auth_service() {
    node -e "
    const grpc = require('@grpc/grpc-js');
    const protoLoader = require('@grpc/proto-loader');
    const path = require('path');
    
    const authProtoDefinition = protoLoader.loadSync(path.join(__dirname, 'proto/auth.proto'), {
        keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
    });
    const authProto = grpc.loadPackageDefinition(authProtoDefinition).auth;
    const client = new authProto.AuthService('localhost:50051', grpc.credentials.createInsecure());
    
    // Test with invalid credentials (should fail gracefully)
    client.Login({ email: 'invalid@test.com', password: 'wrongpass' }, (error, response) => {
        if (error && error.code === 5) { // NOT_FOUND or UNAUTHENTICATED
            console.log('Auth service handles invalid credentials correctly');
            process.exit(0);
        } else {
            console.log('Auth service test failed');
            process.exit(1);
        }
    });
    " 2>/dev/null
}

# Main test execution
main() {
    echo "=== gRPC Server Test Suite ==="
    echo ""
    
    # Check dependencies
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: npm is not installed${NC}"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install || exit 1
    fi
    
    # Run tests
    run_test "Proto files compilation" "test_proto_compilation"
    
    # Start server for integration tests
    if start_test_server; then
        sleep 3  # Give server time to fully initialize
        
        run_test "Server connectivity" "check_server"
        run_test "Auth service basic functionality" "test_auth_service"
        run_test "Full client functionality" "test_client_functionality"
        
        stop_test_server
    else
        echo -e "${RED}Failed to start server for integration tests${NC}"
        ((TESTS_FAILED++))
    fi
    
    # Print results
    echo ""
    echo "=== Test Results ==="
    echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed! ✓${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed! ✗${NC}"
        exit 1
    fi
}

# Cleanup on exit
trap stop_test_server EXIT

# Run main function
main
