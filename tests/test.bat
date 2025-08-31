@echo off
chcp 65001 >nul
echo Running gRPC Server Tests...

set TESTS_PASSED=0
set TESTS_FAILED=0
set SERVER_PID=

REM Function to run a test and check result
:run_test
set test_name=%~1
set test_command=%~2

echo Testing: %test_name%

call %test_command%
if %errorlevel% equ 0 (
    echo [PASS] %test_name%
    set /a TESTS_PASSED+=1
) else (
    echo [FAIL] %test_name%
    set /a TESTS_FAILED+=1
)
goto :eof

REM Check if server is running
:check_server
netstat -an | find "50051" | find "LISTENING" >nul 2>&1
goto :eof

REM Start server in background if not running
:start_test_server
call :check_server
if %errorlevel% neq 0 (
    echo Starting test server...
    start /b cmd /c "npm start"
    
    REM Wait for server to start
    for /l %%i in (1,1,15) do (
        timeout /t 2 >nul
        call :check_server
        if !errorlevel! equ 0 (
            echo Server started successfully
            goto :eof
        )
        echo Waiting for server to start... (%%i/15^)
    )
    
    echo Failed to start server
    exit /b 1
) else (
    echo Server is already running
)
goto :eof

REM Proto compilation test
:test_proto_compilation
where protoc >nul 2>&1
if %errorlevel% equ 0 (
    set proto_errors=0
    for %%f in (proto\*.proto) do (
        protoc --js_out=temp "%%f" >nul 2>&1
        if !errorlevel! neq 0 (
            set /a proto_errors+=1
        )
    )
    if %proto_errors% equ 0 (
        exit /b 0
    ) else (
        exit /b 1
    )
) else (
    echo protoc not available, skipping proto compilation test
    exit /b 0
)
goto :eof

REM Test client functionality
:test_client_functionality
timeout /t 30 node client/example.js > temp_client_test.log 2>&1
if %errorlevel% equ 0 (
    findstr /c:"Demo Completed Successfully" temp_client_test.log >nul
    if !errorlevel! equ 0 (
        del temp_client_test.log >nul 2>&1
        exit /b 0
    ) else (
        echo Client did not complete successfully
        type temp_client_test.log
        del temp_client_test.log >nul 2>&1
        exit /b 1
    )
) else (
    echo Client test failed
    type temp_client_test.log
    del temp_client_test.log >nul 2>&1
    exit /b 1
)
goto :eof

REM Test auth service
:test_auth_service
node -e "const grpc = require('@grpc/grpc-js'); const protoLoader = require('@grpc/proto-loader'); const path = require('path'); const authProtoDefinition = protoLoader.loadSync(path.join(process.cwd(), 'proto/auth.proto'), { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }); const authProto = grpc.loadPackageDefinition(authProtoDefinition).auth; const client = new authProto.AuthService('localhost:50051', grpc.credentials.createInsecure()); client.Login({ email: 'invalid@test.com', password: 'wrongpass' }, (error, response) => { if (error && (error.code === 5 || error.code === 16)) { console.log('Auth service handles invalid credentials correctly'); process.exit(0); } else { console.log('Auth service test failed:', error ? error.message : 'No error returned'); process.exit(1); } });" 2>nul
goto :eof

REM Main test execution
:main
echo === gRPC Server Test Suite ===
echo.

REM Check dependencies
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 exit /b 1
)

REM Create temp directory
if not exist temp mkdir temp

REM Run tests
call :run_test "Proto files compilation" "call :test_proto_compilation"

REM Start server for integration tests
call :start_test_server
if %errorlevel% equ 0 (
    timeout /t 3 >nul
    
    call :run_test "Server connectivity" "call :check_server"
    call :run_test "Auth service basic functionality" "call :test_auth_service"
    call :run_test "Full client functionality" "call :test_client_functionality"
    
    REM Stop server
    taskkill /f /im node.exe >nul 2>&1
) else (
    echo Failed to start server for integration tests
    set /a TESTS_FAILED+=1
)

REM Cleanup
if exist temp rmdir /s /q temp >nul 2>&1

REM Print results
echo.
echo === Test Results ===
echo Tests passed: %TESTS_PASSED%
echo Tests failed: %TESTS_FAILED%
echo.

if %TESTS_FAILED% equ 0 (
    echo All tests passed! [PASS]
    exit /b 0
) else (
    echo Some tests failed! [FAIL]
    exit /b 1
)

call :main
