@echo off
echo Starting gRPC Server Build and Run Process...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed. Please install npm first.
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
npm install

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # gRPC Server Configuration
        echo GRPC_HOST=0.0.0.0
        echo GRPC_PORT=50051
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo JWT_EXPIRES_IN=24h
        echo.
        echo # Database Configuration
        echo NODE_ENV=development
    ) > .env
    echo .env file created with default values
)

REM Check if proto files can be compiled (optional protoc check)
protoc --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Checking proto file compilation...
    protoc --version
    for %%f in (proto\*.proto) do (
        protoc --js_out=. "%%f" >nul 2>&1
        if %errorlevel% neq 0 (
            echo Warning: Proto file %%f may have syntax issues
        )
    )
    echo Proto files validated
) else (
    echo Warning: protoc not found. Skipping proto validation.
)

REM Start the server
echo Starting gRPC server...
npm start
