FROM node:18-alpine

# Install protoc for proto compilation validation
RUN apk add --no-cache protobuf

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create .env file with default values
RUN echo "GRPC_HOST=0.0.0.0" > .env && \
    echo "GRPC_PORT=50051" >> .env && \
    echo "JWT_SECRET=your-super-secret-jwt-key-change-this-in-production" >> .env && \
    echo "JWT_EXPIRES_IN=24h" >> .env && \
    echo "NODE_ENV=production" >> .env

# Expose gRPC port
EXPOSE 50051

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const net = require('net'); const client = net.createConnection(50051, '127.0.0.1', () => { console.log('OK'); client.end(); process.exit(0); }); client.on('error', () => process.exit(1)); setTimeout(() => process.exit(1), 3000);"

# Start the server
CMD ["npm", "start"]
