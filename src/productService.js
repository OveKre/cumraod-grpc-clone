const { Product } = require('./models');
const { Op } = require('sequelize');

class ProductService {
  async getProducts(call, callback) {
    try {
      const { page = 1, limit = 10, category, min_price, max_price } = call.request;
      const offset = (page - 1) * limit;

      const whereConditions = {};
      
      if (category) {
        whereConditions.category = category;
      }
      
      if (min_price || max_price) {
        whereConditions.price = {};
        if (min_price) whereConditions.price[Op.gte] = min_price;
        if (max_price) whereConditions.price[Op.lte] = max_price;
      }

      const { count, rows } = await Product.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id', 'ASC']]
      });

      const products = rows.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        category: product.category,
        stock_quantity: product.stock_quantity,
        created_at: product.created_at?.toISOString(),
        updated_at: product.updated_at?.toISOString()
      }));

      const response = {
        success: true,
        products,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        message: 'Products retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Get products error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async createProduct(call, callback) {
    try {
      const { name, description, price, category, stock_quantity } = call.request;

      // Validate input
      if (!name || price === undefined) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Name and price are required'
        });
      }

      // Create product
      const product = await Product.create({
        name,
        description,
        price,
        category,
        stock_quantity: stock_quantity || 0
      });

      const response = {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          category: product.category,
          stock_quantity: product.stock_quantity,
          created_at: product.created_at?.toISOString(),
          updated_at: product.updated_at?.toISOString()
        },
        message: 'Product created successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Create product error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async getProduct(call, callback) {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Product ID is required'
        });
      }

      const product = await Product.findByPk(id);

      if (!product) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Product not found'
        });
      }

      const response = {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          category: product.category,
          stock_quantity: product.stock_quantity,
          created_at: product.created_at?.toISOString(),
          updated_at: product.updated_at?.toISOString()
        },
        message: 'Product retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Get product error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async updateProduct(call, callback) {
    try {
      const { id, name, description, price, category, stock_quantity } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Product ID is required'
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Product not found'
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (category) updateData.category = category;
      if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity;

      await product.update(updateData);

      const response = {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          category: product.category,
          stock_quantity: product.stock_quantity,
          created_at: product.created_at?.toISOString(),
          updated_at: product.updated_at?.toISOString()
        },
        message: 'Product updated successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Update product error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async deleteProduct(call, callback) {
    try {
      const { id } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Product ID is required'
        });
      }

      const product = await Product.findByPk(id);
      if (!product) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Product not found'
        });
      }

      await product.destroy();

      const response = {
        success: true,
        message: 'Product deleted successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Delete product error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ProductService();
