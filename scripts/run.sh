#!/bin/bash

echo "Starting gRPC Server Build and Run Process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# gRPC Server Configuration
GRPC_HOST=0.0.0.0
GRPC_PORT=50051

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database Configuration
NODE_ENV=development
EOF
    echo ".env file created with default values"
fi

# Check if proto files can be compiled (optional protoc check)
if command -v protoc &> /dev/null; then
    echo "Checking proto file compilation..."
    protoc --version
    for proto_file in proto/*.proto; do
        if ! protoc --js_out=. "$proto_file" 2>/dev/null; then
            echo "Warning: Proto file $proto_file may have syntax issues"
        fi
    done
    echo "Proto files validated"
else
    echo "Warning: protoc not found. Skipping proto validation."
fi

# Start the server
echo "Starting gRPC server..."
npm start
