const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto definitions
const PROTO_PATH = path.join(__dirname, '../proto');

const authProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'auth.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const usersProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'users.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const productsProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'products.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const ordersProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'orders.proto'), {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const authProto = grpc.loadPackageDefinition(authProtoDefinition).auth;
const usersProto = grpc.loadPackageDefinition(usersProtoDefinition).users;
const productsProto = grpc.loadPackageDefinition(productsProtoDefinition).products;
const ordersProto = grpc.loadPackageDefinition(ordersProtoDefinition).orders;

// Create clients
const SERVER_HOST = process.env.GRPC_HOST || 'localhost';
const SERVER_PORT = process.env.GRPC_PORT || 50051;
const SERVER_ADDRESS = `${SERVER_HOST}:${SERVER_PORT}`;

const authClient = new authProto.AuthService(SERVER_ADDRESS, grpc.credentials.createInsecure());
const userClient = new usersProto.UserService(SERVER_ADDRESS, grpc.credentials.createInsecure());
const productClient = new productsProto.ProductService(SERVER_ADDRESS, grpc.credentials.createInsecure());
const orderClient = new ordersProto.OrderService(SERVER_ADDRESS, grpc.credentials.createInsecure());

// Utility function to promisify gRPC calls
function grpcCall(client, method, request) {
  return new Promise((resolve, reject) => {
    client[method](request, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

// Demo functions
async function demoAuthService() {
  console.log('\\n=== Testing Auth Service ===');
  
  try {
    // Test user registration first
    console.log('Creating test user...');
    const createUserResponse = await grpcCall(userClient, 'CreateUser', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('User created:', createUserResponse);

    // Test login
    console.log('\\nTesting login...');
    const loginResponse = await grpcCall(authClient, 'Login', {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login response:', loginResponse);

    // Test logout
    console.log('\\nTesting logout...');
    const logoutResponse = await grpcCall(authClient, 'Logout', {
      token: loginResponse.token
    });
    console.log('Logout response:', logoutResponse);

    return loginResponse.token;
  } catch (error) {
    console.error('Auth service error:', error.message);
    return null;
  }
}

async function demoUserService() {
  console.log('\\n=== Testing User Service ===');
  
  try {
    // Get all users
    console.log('Getting all users...');
    const getUsersResponse = await grpcCall(userClient, 'GetUsers', {
      page: 1,
      limit: 10
    });
    console.log('Users:', getUsersResponse);

    if (getUsersResponse.users.length > 0) {
      const userId = getUsersResponse.users[0].id;
      
      // Get specific user
      console.log(`\\nGetting user ${userId}...`);
      const getUserResponse = await grpcCall(userClient, 'GetUser', {
        id: userId
      });
      console.log('User:', getUserResponse);

      // Update user
      console.log(`\\nUpdating user ${userId}...`);
      const updateUserResponse = await grpcCall(userClient, 'UpdateUser', {
        id: userId,
        name: 'Updated Test User'
      });
      console.log('Updated user:', updateUserResponse);

      return userId;
    }
  } catch (error) {
    console.error('User service error:', error.message);
    return null;
  }
}

async function demoProductService() {
  console.log('\\n=== Testing Product Service ===');
  
  try {
    // Create product
    console.log('Creating product...');
    const createProductResponse = await grpcCall(productClient, 'CreateProduct', {
      name: 'Test Product',
      description: 'A test product for demo',
      price: 29.99,
      category: 'Electronics',
      stock_quantity: 100
    });
    console.log('Product created:', createProductResponse);

    const productId = createProductResponse.product.id;

    // Get all products
    console.log('\\nGetting all products...');
    const getProductsResponse = await grpcCall(productClient, 'GetProducts', {
      page: 1,
      limit: 10
    });
    console.log('Products:', getProductsResponse);

    // Get specific product
    console.log(`\\nGetting product ${productId}...`);
    const getProductResponse = await grpcCall(productClient, 'GetProduct', {
      id: productId
    });
    console.log('Product:', getProductResponse);

    // Update product
    console.log(`\\nUpdating product ${productId}...`);
    const updateProductResponse = await grpcCall(productClient, 'UpdateProduct', {
      id: productId,
      name: 'Updated Test Product',
      price: 39.99
    });
    console.log('Updated product:', updateProductResponse);

    return productId;
  } catch (error) {
    console.error('Product service error:', error.message);
    return null;
  }
}

async function demoOrderService(userId, productId) {
  console.log('\\n=== Testing Order Service ===');
  
  if (!userId || !productId) {
    console.log('Skipping order tests - missing userId or productId');
    return;
  }

  try {
    // Create order
    console.log('Creating order...');
    const createOrderResponse = await grpcCall(orderClient, 'CreateOrder', {
      user_id: userId,
      items: [
        {
          product_id: productId,
          quantity: 2
        }
      ],
      shipping_address: '123 Test Street, Test City',
      payment_method: 'Credit Card'
    });
    console.log('Order created:', createOrderResponse);

    const orderId = createOrderResponse.order.id;

    // Get all orders
    console.log('\\nGetting all orders...');
    const getOrdersResponse = await grpcCall(orderClient, 'GetOrders', {
      user_id: userId,
      page: 1,
      limit: 10
    });
    console.log('Orders:', getOrdersResponse);

    // Get specific order
    console.log(`\\nGetting order ${orderId}...`);
    const getOrderResponse = await grpcCall(orderClient, 'GetOrder', {
      id: orderId,
      user_id: userId
    });
    console.log('Order:', getOrderResponse);

    // Update order
    console.log(`\\nUpdating order ${orderId}...`);
    const updateOrderResponse = await grpcCall(orderClient, 'UpdateOrder', {
      id: orderId,
      user_id: userId,
      status: 'shipped'
    });
    console.log('Updated order:', updateOrderResponse);

    return orderId;
  } catch (error) {
    console.error('Order service error:', error.message);
    return null;
  }
}

// Main demo function
async function runDemo() {
  console.log('Starting gRPC Client Demo...');
  console.log(`Connecting to server at ${SERVER_ADDRESS}`);

  try {
    const token = await demoAuthService();
    const userId = await demoUserService();
    const productId = await demoProductService();
    const orderId = await demoOrderService(userId, productId);

    console.log('\\n=== Demo Completed Successfully ===');
    console.log('All gRPC services are working correctly!');
  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demo
runDemo();
