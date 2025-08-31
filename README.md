# gRPC REST API Clone

This project is a gRPC implementation of an existing REST API, providing exactly the same functionality using the gRPC protocol.

## Project Overview

This gRPC server reproduces the following REST API functionality:
- **Authentication**: Login and logout with JWT tokens
- **User Management**: CRUD operations for users
- **Product Management**: CRUD operations for products
- **Order Management**: CRUD operations for orders

## Technical Details

- **Programming Language**: Node.js
- **gRPC Framework**: @grpc/grpc-js
- **Database**: SQLite + Sequelize ORM
- **Authentication**: JWT tokens + bcrypt for password hashing
- **Protocol**: Protocol Buffers (protobuf)

## Directory Structure

```
/
├── proto/              # Protocol Buffer definitions
│   ├── auth.proto      # Authentication services
│   ├── users.proto     # User services
│   ├── products.proto  # Product services
│   ├── orders.proto    # Order services
│   ├── forms.proto     # Form services (security testing)
│   └── common.proto    # Common messages
├── src/                # Source code
│   ├── server.js       # Main gRPC server
│   ├── models.js       # Database models
│   ├── authService.js  # Authentication service implementation
│   ├── authMiddleware.js # Token validation middleware
│   ├── userService.js  # User service implementation
│   ├── productService.js # Product service implementation
│   ├── orderService.js # Order service implementation
│   └── formsService.js # Forms service implementation
├── client/             # Client examples
│   └── example.js      # Demo client
├── tests/              # Automated tests
│   ├── test.sh         # Linux/Mac test script
│   ├── test.bat        # Windows test script
│   ├── test.ps1        # PowerShell test script
│   └── logout-security-test.js # Security test for logout
├── scripts/            # Launch scripts
│   ├── run.sh          # Linux/Mac launch script
│   └── run.bat         # Windows launch script
├── docker-compose.yml  # Docker Compose configuration
├── Dockerfile          # Docker container
├── package.json        # Node.js project configuration
└── README.md          # This file
```

## Prerequisites

The following tools must be installed:

1. **Node.js** (version 16 or newer)
   - Download: https://nodejs.org/
   - Check: `node --version`

2. **npm** (comes with Node.js)
   - Check: `npm --version`

3. **Git** (for working with the project)
   - Download: https://git-scm.com/
   - Check: `git --version`

4. **Protocol Buffers Compiler (protoc)** (optional, for validation)
   - Download: https://protobuf.dev/downloads/
   - Check: `protoc --version`

## Quick Start

### 1. Download Project

```bash
git clone https://github.com/OveKre/cumraod-grpc-clone.git
cd cumraod-grpc-clone
```

### 2. Launch

#### Linux/Mac:
```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

#### Windows:
```cmd
scripts\\run.bat
```

#### Using Docker:
```bash
docker-compose up --build
```

The server will start and listen on port 50051.

## Usage

### Starting the Server

1. **Direct launch:**
   ```bash
   npm install
   npm start
   ```

2. **Development mode (automatic restart):**
   ```bash
   npm run dev
   ```

3. **Using Docker:**
   ```bash
   docker-compose up
   ```

### Running Client Example

```bash
npm run client
```

or

```bash
node client/example.js
```

### Running Tests

#### Linux/Mac:
```bash
chmod +x tests/test.sh
./tests/test.sh
```

#### Windows:
```cmd
tests\\test.bat
```

#### PowerShell:
```powershell
.\tests\test.ps1
```

## gRPC Services

### 1. AuthService (auth.proto)

**Endpoints:**
- `Login(LoginRequest) → LoginResponse`
- `Logout(LogoutRequest) → LogoutResponse`

**Usage example:**
```javascript
const response = await authClient.Login({
  email: 'user@example.com',
  password: 'password123'
});
```

### 2. UserService (users.proto)

**Endpoints:**
- `GetUsers(GetUsersRequest) → GetUsersResponse`
- `CreateUser(CreateUserRequest) → CreateUserResponse`
- `GetUser(GetUserRequest) → GetUserResponse`
- `UpdateUser(UpdateUserRequest) → UpdateUserResponse`
- `DeleteUser(DeleteUserRequest) → DeleteUserResponse`

### 3. ProductService (products.proto)

**Endpoints:**
- `GetProducts(GetProductsRequest) → GetProductsResponse`
- `CreateProduct(CreateProductRequest) → CreateProductResponse`
- `GetProduct(GetProductRequest) → GetProductResponse`
- `UpdateProduct(UpdateProductRequest) → UpdateProductResponse`
- `DeleteProduct(DeleteProductRequest) → DeleteProductResponse`

### 4. OrderService (orders.proto)

**Endpoints:**
- `GetOrders(GetOrdersRequest) → GetOrdersResponse`
- `CreateOrder(CreateOrderRequest) → CreateOrderResponse`
- `GetOrder(GetOrderRequest) → GetOrderResponse`
- `UpdateOrder(UpdateOrderRequest) → UpdateOrderResponse`
- `DeleteOrder(DeleteOrderRequest) → DeleteOrderResponse`

### 5. FormsService (forms.proto)

**Endpoints (for security testing):**
- `CreateForm(CreateFormRequest) → CreateFormResponse`
- `ListForms(ListFormsRequest) → ListFormsResponse`
- `GetForm(GetFormRequest) → GetFormResponse`
- `DeleteForm(DeleteFormRequest) → DeleteFormResponse`

## Configuration

### Environment Variables (.env file)

```env
# gRPC server configuration
GRPC_HOST=0.0.0.0
GRPC_PORT=50051

# JWT configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database configuration
NODE_ENV=development
```

## Error Handling

The gRPC server uses standard gRPC status codes:

- `OK (0)` - Successful response
- `INVALID_ARGUMENT (3)` - Invalid input parameters
- `NOT_FOUND (5)` - Resource not found
- `ALREADY_EXISTS (6)` - Resource already exists
- `UNAUTHENTICATED (16)` - Authentication failed
- `INTERNAL (13)` - Internal server error

## Testing

### Automated Tests

Tests verify:
1. Proto file compilation
2. Server connectivity
3. Authentication service functionality
4. Client integration tests
5. Security (logout token invalidation)

### Manual Testing

1. Start server:
   ```bash
   npm start
   ```

2. In another terminal, run client:
   ```bash
   npm run client
   ```

3. Check output - all RPC calls should succeed.

### Security Testing

Run the logout security test:
```bash
node tests/logout-security-test.js
```

This test verifies that tokens are properly invalidated after logout.

## REST vs gRPC Mapping

| REST Endpoint | HTTP Method | gRPC RPC | Proto File |
|---------------|-------------|----------|-----------|
| `/sessions` | POST | AuthService.Login | auth.proto |
| `/sessions` | DELETE | AuthService.Logout | auth.proto |
| `/users` | GET | UserService.GetUsers | users.proto |
| `/users` | POST | UserService.CreateUser | users.proto |
| `/users/:id` | GET | UserService.GetUser | users.proto |
| `/users/:id` | PATCH | UserService.UpdateUser | users.proto |
| `/users/:id` | DELETE | UserService.DeleteUser | users.proto |
| `/products` | GET | ProductService.GetProducts | products.proto |
| `/products` | POST | ProductService.CreateProduct | products.proto |
| `/products/:id` | GET | ProductService.GetProduct | products.proto |
| `/products/:id` | PATCH | ProductService.UpdateProduct | products.proto |
| `/products/:id` | DELETE | ProductService.DeleteProduct | products.proto |
| `/orders` | GET | OrderService.GetOrders | orders.proto |
| `/orders` | POST | OrderService.CreateOrder | orders.proto |
| `/orders/:id` | GET | OrderService.GetOrder | orders.proto |
| `/orders/:id` | PATCH | OrderService.UpdateOrder | orders.proto |
| `/orders/:id` | DELETE | OrderService.DeleteOrder | orders.proto |

## Security Features

### Secure Logout Implementation

This project includes a secure logout mechanism that properly invalidates JWT tokens:

- **Token Blacklisting**: Logout adds tokens to a blacklist table
- **Middleware Validation**: All authenticated endpoints check the blacklist
- **Security Testing**: Automated tests verify token invalidation

### Authentication Flow

1. **Login**: Generates JWT token
2. **Authenticated Requests**: Token validated + blacklist checked
3. **Logout**: Token added to blacklist
4. **Post-Logout**: All requests with that token are rejected

## Troubleshooting

### Common Issues

1. **Port 50051 already in use:**
   ```bash
   # Check what process is using the port
   netstat -tulpn | grep 50051
   # Or change port in .env file
   echo "GRPC_PORT=50052" >> .env
   ```

2. **Proto file compilation fails:**
   ```bash
   # Install protoc
   # Ubuntu/Debian:
   sudo apt-get install protobuf-compiler
   # macOS:
   brew install protobuf
   # Windows: download from protobuf.dev
   ```

3. **Database errors:**
   ```bash
   # Delete database and restart
   rm database.sqlite
   npm start
   ```

4. **Node.js version too old:**
   ```bash
   # Update Node.js to version 16 or newer
   node --version
   # Install nvm and use newer version
   ```

## Development

### Adding a New Service

1. Create new `.proto` file in `proto/` folder
2. Define service and messages
3. Create service implementation in `src/` folder
4. Add service to `src/server.js`
5. Update client example
6. Add tests

### Code Style

- Use ESLint configuration
- Follow Protocol Buffers naming conventions
- Comment complex business logic
- Use async/await instead of Promises

## Authors

**TAK24 Group**

## License

MIT

## Additional Information

More about gRPC: https://grpc.io/
Protocol Buffers documentation: https://protobuf.dev/
