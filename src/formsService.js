const { Form } = require('./models');
const authMiddleware = require('./authMiddleware');

class FormsService {
  async createForm(call, callback) {
    try {
      const { token, title, description } = call.request;
      
      // Validate token
      const validation = await authMiddleware.validateToken(token);
      if (!validation.valid) {
        return callback({
          code: validation.code,
          message: validation.error
        });
      }

      // Validate input
      if (!title) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Title is required'
        });
      }

      // Create form
      const form = await Form.create({
        user_id: validation.userId,
        title,
        description: description || ''
      });

      const response = {
        success: true,
        form: {
          id: form.id,
          user_id: form.user_id,
          title: form.title,
          description: form.description,
          created_at: form.created_at?.toISOString(),
          updated_at: form.updated_at?.toISOString()
        },
        message: 'Form created successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Create form error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async listForms(call, callback) {
    try {
      const { token, page = 1, limit = 10 } = call.request;
      
      // Validate token - THIS IS CRITICAL!
      const validation = await authMiddleware.validateToken(token);
      if (!validation.valid) {
        return callback({
          code: validation.code,
          message: validation.error
        });
      }

      // Get user's forms only
      const offset = (page - 1) * limit;
      const { count, rows } = await Form.findAndCountAll({
        where: { user_id: validation.userId },
        limit: limit,
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      const response = {
        success: true,
        forms: rows.map(form => ({
          id: form.id,
          user_id: form.user_id,
          title: form.title,
          description: form.description,
          created_at: form.created_at?.toISOString(),
          updated_at: form.updated_at?.toISOString()
        })),
        total: count,
        message: 'Forms retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('List forms error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async getForm(call, callback) {
    try {
      const { token, id } = call.request;
      
      // Validate token
      const validation = await authMiddleware.validateToken(token);
      if (!validation.valid) {
        return callback({
          code: validation.code,
          message: validation.error
        });
      }

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Form ID is required'
        });
      }

      // Find form that belongs to the user
      const form = await Form.findOne({
        where: { 
          id: id,
          user_id: validation.userId 
        }
      });

      if (!form) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Form not found'
        });
      }

      const response = {
        success: true,
        form: {
          id: form.id,
          user_id: form.user_id,
          title: form.title,
          description: form.description,
          created_at: form.created_at?.toISOString(),
          updated_at: form.updated_at?.toISOString()
        },
        message: 'Form retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Get form error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async deleteForm(call, callback) {
    try {
      const { token, id } = call.request;
      
      // Validate token
      const validation = await authMiddleware.validateToken(token);
      if (!validation.valid) {
        return callback({
          code: validation.code,
          message: validation.error
        });
      }

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Form ID is required'
        });
      }

      // Find and delete form that belongs to the user
      const deleted = await Form.destroy({
        where: { 
          id: id,
          user_id: validation.userId 
        }
      });

      if (!deleted) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Form not found'
        });
      }

      const response = {
        success: true,
        message: 'Form deleted successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Delete form error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new FormsService();
