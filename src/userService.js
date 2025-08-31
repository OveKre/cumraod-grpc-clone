const bcrypt = require('bcrypt');
const { User } = require('./models');
const { Op } = require('sequelize');

class UserService {
  async getUsers(call, callback) {
    try {
      const { page = 1, limit = 10 } = call.request;
      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: { exclude: ['password'] },
        order: [['id', 'ASC']]
      });

      const users = rows.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at?.toISOString(),
        updated_at: user.updated_at?.toISOString()
      }));

      const response = {
        success: true,
        users,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        message: 'Users retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Get users error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async createUser(call, callback) {
    try {
      const { name, email, password } = call.request;

      // Validate input
      if (!name || !email || !password) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Name, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return callback({
          code: 6, // ALREADY_EXISTS
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword
      });

      const response = {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at?.toISOString(),
          updated_at: user.updated_at?.toISOString()
        },
        message: 'User created successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Create user error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async getUser(call, callback) {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'User ID is required'
        });
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'User not found'
        });
      }

      const response = {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at?.toISOString(),
          updated_at: user.updated_at?.toISOString()
        },
        message: 'User retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Get user error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async updateUser(call, callback) {
    try {
      const { id, name, email, password } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'User ID is required'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'User not found'
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) updateData.password = await bcrypt.hash(password, 10);

      await user.update(updateData);

      const response = {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at?.toISOString(),
          updated_at: user.updated_at?.toISOString()
        },
        message: 'User updated successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Update user error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async deleteUser(call, callback) {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'User ID is required'
        });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'User not found'
        });
      }

      await user.destroy();

      const response = {
        success: true,
        message: 'User deleted successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Delete user error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new UserService();
