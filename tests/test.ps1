# gRPC Server Test Suite
# PowerShell version for better Windows compatibility

Write-Host "=== gRPC Server Test Suite ===" -ForegroundColor Cyan
Write-Host ""

$TestsPassed = 0
$TestsFailed = 0

# Test 1: Node.js availability
Write-Host "[1/5] Testing Node.js availability..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "[PASS] Node.js is available (version: $nodeVersion)" -ForegroundColor Green
    $TestsPassed++
} catch {
    Write-Host "[FAIL] Node.js is not available" -ForegroundColor Red
    $TestsFailed++
}

# Test 2: Dependencies
Write-Host "[2/5] Testing dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "[PASS] Dependencies are installed" -ForegroundColor Green
    $TestsPassed++
} else {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    npm install | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Dependencies installed successfully" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "[FAIL] Failed to install dependencies" -ForegroundColor Red
        $TestsFailed++
    }
}

# Test 3: Server connectivity
Write-Host "[3/5] Testing server connectivity..." -ForegroundColor Yellow
$serverCheck = node check-server.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[PASS] Server is running and accessible" -ForegroundColor Green
    $TestsPassed++
} else {
    Write-Host "[INFO] Server not running, attempting to start..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList '-WindowStyle', 'Minimized', '-Command', "cd '$PWD'; npm start" -PassThru | Out-Null
    Start-Sleep -Seconds 8
    
    $serverCheck = node check-server.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Server started and is accessible" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "[FAIL] Failed to start or connect to server" -ForegroundColor Red
        $TestsFailed++
    }
}

# Test 4: Protobuf compilation
Write-Host "[4/5] Testing protobuf compilation..." -ForegroundColor Yellow
try {
    New-Item -ItemType Directory -Name "temp-test" -Force | Out-Null
    npx protoc --proto_path=proto --js_out=temp-test proto/auth.proto 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Protobuf files compile successfully" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "[FAIL] Protobuf compilation failed" -ForegroundColor Red
        $TestsFailed++
    }
    Remove-Item "temp-test" -Recurse -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "[FAIL] Protobuf compilation failed with exception" -ForegroundColor Red
    $TestsFailed++
}

# Test 5: Client functionality
Write-Host "[5/5] Testing client functionality..." -ForegroundColor Yellow
try {
    $clientOutput = npm run client 2>&1
    if ($clientOutput -match "Demo Completed Successfully") {
        Write-Host "[PASS] Client demo completed successfully" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "[FAIL] Client demo failed" -ForegroundColor Red
        $TestsFailed++
    }
} catch {
    Write-Host "[FAIL] Client test failed with exception" -ForegroundColor Red
    $TestsFailed++
}

# Results
Write-Host ""
Write-Host "=== Test Results ===" -ForegroundColor Cyan
Write-Host "Tests passed: $TestsPassed" -ForegroundColor Green
Write-Host "Tests failed: $TestsFailed" -ForegroundColor Red
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "[SUCCESS] All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[ERROR] Some tests failed!" -ForegroundColor Red
    exit 1
}
