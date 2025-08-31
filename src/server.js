const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const authService = require('./authService');
const userService = require('./userService');
const productService = require('./productService');
const orderService = require('./orderService');
const formsService = require('./formsService');

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

const formsProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'forms.proto'), {
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
const formsProto = grpc.loadPackageDefinition(formsProtoDefinition).forms;

// Create gRPC server
const server = new grpc.Server();

// Add services
server.addService(authProto.AuthService.service, {
  Login: authService.login.bind(authService),
  Logout: authService.logout.bind(authService)
});

server.addService(usersProto.UserService.service, {
  GetUsers: userService.getUsers.bind(userService),
  CreateUser: userService.createUser.bind(userService),
  GetUser: userService.getUser.bind(userService),
  UpdateUser: userService.updateUser.bind(userService),
  DeleteUser: userService.deleteUser.bind(userService)
});

server.addService(productsProto.ProductService.service, {
  GetProducts: productService.getProducts.bind(productService),
  CreateProduct: productService.createProduct.bind(productService),
  GetProduct: productService.getProduct.bind(productService),
  UpdateProduct: productService.updateProduct.bind(productService),
  DeleteProduct: productService.deleteProduct.bind(productService)
});

server.addService(ordersProto.OrderService.service, {
  GetOrders: orderService.getOrders.bind(orderService),
  CreateOrder: orderService.createOrder.bind(orderService),
  GetOrder: orderService.getOrder.bind(orderService),
  UpdateOrder: orderService.updateOrder.bind(orderService),
  DeleteOrder: orderService.deleteOrder.bind(orderService)
});

server.addService(formsProto.FormsService.service, {
  CreateForm: formsService.createForm.bind(formsService),
  ListForms: formsService.listForms.bind(formsService),
  GetForm: formsService.getForm.bind(formsService),
  DeleteForm: formsService.deleteForm.bind(formsService)
});

// Server startup
async function startServer() {
  try {
    // Initialize database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('Database synchronized.');

    // Start gRPC server
    const PORT = process.env.GRPC_PORT || 50051;
    const HOST = process.env.GRPC_HOST || '0.0.0.0';
    
    server.bindAsync(
      `${HOST}:${PORT}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error('Failed to bind server:', error);
          return;
        }
        
        console.log(`gRPC server running on ${HOST}:${port}`);
        server.start();
      }
    );
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.tryShutdown(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.tryShutdown(() => {
    console.log('Server stopped.');
    process.exit(0);
  });
});

// Start the server
startServer();
