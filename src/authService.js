const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, BlacklistedToken } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  async login(call, callback) {
    try {
      const { email, password } = call.request;

      // Validate input
      if (!email || !password) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Email and password are required'
        });
      }

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return callback({
          code: 16, // UNAUTHENTICATED
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const response = {
        success: true,
        token,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at?.toISOString(),
          updated_at: user.updated_at?.toISOString()
        }
      };

      callback(null, response);
    } catch (error) {
      console.error('Login error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async logout(call, callback) {
    try {
      const { token } = call.request;

      if (!token) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Token is required'
        });
      }

      // Add token to blacklist
      await BlacklistedToken.create({ token });

      const response = {
        success: true,
        message: 'Logout successful'
      };

      callback(null, response);
    } catch (error) {
      console.error('Logout error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthService();
