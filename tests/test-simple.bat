@echo off
chcp 65001 >nul 2>&1

echo === gRPC Server Test Suite ===
echo.

set TESTS_PASSED=0
set TESTS_FAILED=0

echo [1/4] Testing Node.js availability...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Node.js is available
    set /a TESTS_PASSED+=1
) else (
    echo [FAIL] Node.js is not available
    set /a TESTS_FAILED+=1
)

echo [2/4] Testing dependencies...
if exist node_modules (
    echo [PASS] Dependencies are installed
    set /a TESTS_PASSED+=1
) else (
    echo [INFO] Installing dependencies...
    npm install >nul 2>&1
    if %errorlevel% equ 0 (
        echo [PASS] Dependencies installed successfully
        set /a TESTS_PASSED+=1
    ) else (
        echo [FAIL] Failed to install dependencies
        set /a TESTS_FAILED+=1
    )
)

echo [3/4] Testing server connectivity...
node check-server.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Server is running and accessible
    set /a TESTS_PASSED+=1
) else (
    echo [INFO] Server not running, starting it...
    start /min cmd /c "npm start"
    timeout /t 8 >nul
    node check-server.js >nul 2>&1
    if %errorlevel% equ 0 (
        echo [PASS] Server started and is accessible
        set /a TESTS_PASSED+=1
    ) else (
        echo [FAIL] Failed to start or connect to server
        set /a TESTS_FAILED+=1
    )
)

echo [4/4] Testing client functionality...
npm run client >temp-client-output.txt 2>&1
findstr /c:"Demo Completed Successfully" temp-client-output.txt >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Client demo completed successfully
    set /a TESTS_PASSED+=1
) else (
    echo [FAIL] Client demo failed
    set /a TESTS_FAILED+=1
)
if exist temp-client-output.txt del temp-client-output.txt >nul 2>&1

echo.
echo === Test Results ===
echo Tests passed: %TESTS_PASSED%
echo Tests failed: %TESTS_FAILED%
echo.

if %TESTS_FAILED% equ 0 (
    echo [SUCCESS] All tests passed!
    exit /b 0
) else (
    echo [ERROR] Some tests failed!
    exit /b 1
)
