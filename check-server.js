const net = require('net');

const client = net.createConnection(50051, '127.0.0.1', () => {
  console.log('✓ gRPC server is running on port 50051');
  client.end();
  process.exit(0);
});

client.on('error', (err) => {
  console.log('✗ gRPC server is not running on port 50051');
  console.log('Error:', err.message);
  process.exit(1);
});

client.setTimeout(3000, () => {
  console.log('✗ Connection timeout');
  client.destroy();
  process.exit(1);
});
