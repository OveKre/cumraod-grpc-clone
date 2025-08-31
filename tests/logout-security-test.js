const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto definitions
const PROTO_PATH = path.join(__dirname, '../proto');

const authProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'auth.proto'), {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});

const usersProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'users.proto'), {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});

const formsProtoDefinition = protoLoader.loadSync(path.join(PROTO_PATH, 'forms.proto'), {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});

const authProto = grpc.loadPackageDefinition(authProtoDefinition).auth;
const usersProto = grpc.loadPackageDefinition(usersProtoDefinition).users;
const formsProto = grpc.loadPackageDefinition(formsProtoDefinition).forms;

// Create clients
const SERVER_ADDRESS = 'localhost:50051';
const authClient = new authProto.AuthService(SERVER_ADDRESS, grpc.credentials.createInsecure());
const userClient = new usersProto.UserService(SERVER_ADDRESS, grpc.credentials.createInsecure());
const formsClient = new formsProto.FormsService(SERVER_ADDRESS, grpc.credentials.createInsecure());

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

async function testLogoutVulnerability() {
  console.log('=== gRPC LOGOUT SECURITY TEST ===');
  console.log('Testing if tokens are properly invalidated after logout');
  console.log('');

  const timestamp = Date.now();
  const testEmail = `sectest${timestamp}@example.com`;
  
  try {
    // Step 1: Create test user
    console.log('STEP 1: Creating test user...');
    const createUserResponse = await grpcCall(userClient, 'CreateUser', {
      name: `Security Test User ${timestamp}`,
      email: testEmail,
      password: 'SecurePassword123!'
    });
    console.log('✓ User created:', {
      id: createUserResponse.user.id,
      email: createUserResponse.user.email
    });
    console.log('');

    // Step 2: Login to get token
    console.log('STEP 2: Logging in...');
    const loginResponse = await grpcCall(authClient, 'Login', {
      email: testEmail,
      password: 'SecurePassword123!'
    });
    const token = loginResponse.token;
    console.log('✓ Login successful');
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('');

    // Step 3: Create a form (private data)
    console.log('STEP 3: Creating private form...');
    const createFormResponse = await grpcCall(formsClient, 'CreateForm', {
      token: token,
      title: 'Top Secret Form',
      description: 'This contains sensitive private data that should not be accessible after logout'
    });
    console.log('✓ Form created:', {
      id: createFormResponse.form.id,
      title: createFormResponse.form.title
    });
    console.log('');

    // Step 4: Verify we can access the form before logout
    console.log('STEP 4: Accessing forms BEFORE logout...');
    const formsBeforeLogout = await grpcCall(formsClient, 'ListForms', {
      token: token
    });
    console.log('✓ Forms accessible before logout:', formsBeforeLogout.forms.length, 'forms found');
    console.log('');

    // Step 5: Logout
    console.log('STEP 5: Logging out...');
    const logoutResponse = await grpcCall(authClient, 'Logout', {
      token: token
    });
    console.log('✓ Logout response:', logoutResponse.message);
    console.log('');

    // Step 6: Try to access forms after logout (THIS IS THE CRITICAL TEST)
    console.log('STEP 6: Trying to access forms AFTER logout...');
    try {
      const formsAfterLogout = await grpcCall(formsClient, 'ListForms', {
        token: token
      });
      
      // If we get here, it's a VULNERABILITY!
      console.log('❌ SECURITY VULNERABILITY DETECTED!');
      console.log('   Token was NOT properly invalidated');
      console.log('   Forms still accessible:', formsAfterLogout.forms.length, 'forms found');
      console.log('   🚨 CRITICAL: Private data accessible after logout!');
      return false;
      
    } catch (error) {
      // This is the EXPECTED behavior - token should be invalid
      if (error.code === 16) { // UNAUTHENTICATED
        console.log('✅ SECURITY TEST PASSED!');
        console.log('   Token properly invalidated');
        console.log('   Error:', error.message);
        console.log('   🔒 Private data protected after logout');
        return true;
      } else {
        console.log('❓ Unexpected error:', error.message);
        return false;
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

async function runSecurityTest() {
  console.log('Starting gRPC Logout Security Test...');
  console.log('Connecting to server at', SERVER_ADDRESS);
  console.log('');

  const testPassed = await testLogoutVulnerability();
  
  console.log('');
  console.log('=== SECURITY TEST RESULTS ===');
  if (testPassed) {
    console.log('✅ SECURE: Logout properly invalidates tokens');
    console.log('✅ SECURE: Private data protected after logout');
    console.log('✅ RECOMMENDATION: Implementation is secure');
  } else {
    console.log('❌ VULNERABLE: Logout does NOT invalidate tokens');
    console.log('❌ VULNERABLE: Private data accessible after logout');
    console.log('🚨 RECOMMENDATION: Implement token blacklisting');
  }
  
  process.exit(testPassed ? 0 : 1);
}

// Run the test
runSecurityTest().catch(error => {
  console.error('Security test crashed:', error);
  process.exit(1);
});
