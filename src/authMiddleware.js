const jwt = require('jsonwebtoken');
const { BlacklistedToken } = require('./models');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

class AuthMiddleware {
  /**
   * Validate JWT token and check if it's blacklisted
   */
  async validateToken(token) {
    try {
      if (!token) {
        return {
          valid: false,
          error: 'Token is required',
          code: 3 // INVALID_ARGUMENT
        };
      }

      // Check if token is blacklisted
      const blacklistedToken = await BlacklistedToken.findOne({ 
        where: { token } 
      });
      
      if (blacklistedToken) {
        return {
          valid: false,
          error: 'Token has been invalidated',
          code: 16 // UNAUTHENTICATED
        };
      }

      // Verify JWT token
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return {
          valid: true,
          decoded,
          userId: decoded.id,
          userEmail: decoded.email
        };
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          return {
            valid: false,
            error: 'Token has expired',
            code: 16 // UNAUTHENTICATED
          };
        } else if (jwtError.name === 'JsonWebTokenError') {
          return {
            valid: false,
            error: 'Invalid token',
            code: 16 // UNAUTHENTICATED
          };
        } else {
          return {
            valid: false,
            error: 'Token verification failed',
            code: 16 // UNAUTHENTICATED
          };
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        valid: false,
        error: 'Internal authentication error',
        code: 13 // INTERNAL
      };
    }
  }

  /**
   * gRPC middleware wrapper for token validation
   */
  requireAuth(call, callback, next) {
    return async (call, callback) => {
      const token = call.request.token;
      const validation = await this.validateToken(token);
      
      if (!validation.valid) {
        return callback({
          code: validation.code,
          message: validation.error
        });
      }
      
      // Add user info to call for use in service methods
      call.user = {
        id: validation.userId,
        email: validation.userEmail,
        decoded: validation.decoded
      };
      
      // Call the actual service method
      return next(call, callback);
    };
  }

  /**
   * Helper method to extract token from different request formats
   */
  extractToken(request) {
    // Direct token field
    if (request.token) {
      return request.token;
    }
    
    // Authorization header format (if using metadata)
    if (request.authorization) {
      const parts = request.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
    }
    
    return null;
  }
}

module.exports = new AuthMiddleware();
