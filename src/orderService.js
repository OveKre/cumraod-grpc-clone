const { Order, OrderItem, Product, User } = require('./models');

class OrderService {
  async getOrders(call, callback) {
    try {
      const { user_id, page = 1, limit = 10, status } = call.request;
      const offset = (page - 1) * limit;

      const whereConditions = {};
      if (user_id) whereConditions.user_id = user_id;
      if (status) whereConditions.status = status;

      const { count, rows } = await Order.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: OrderItem,
            attributes: ['product_id', 'product_name', 'quantity', 'price', 'subtotal']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id', 'DESC']]
      });

      const orders = rows.map(order => ({
        id: order.id,
        user_id: order.user_id,
        items: order.OrderItems?.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal)
        })) || [],
        total_amount: parseFloat(order.total_amount),
        status: order.status,
        shipping_address: order.shipping_address,
        payment_method: order.payment_method,
        created_at: order.created_at?.toISOString(),
        updated_at: order.updated_at?.toISOString()
      }));

      const response = {
        success: true,
        orders,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        message: 'Orders retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Get orders error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async createOrder(call, callback) {
    try {
      const { user_id, items, shipping_address, payment_method } = call.request;

      // Validate input
      if (!user_id || !items || items.length === 0) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'User ID and items are required'
        });
      }

      // Check if user exists
      const user = await User.findByPk(user_id);
      if (!user) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'User not found'
        });
      }

      // Validate products and calculate total
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findByPk(item.product_id);
        if (!product) {
          return callback({
            code: 5, // NOT_FOUND
            message: `Product with ID ${item.product_id} not found`
          });
        }

        if (product.stock_quantity < item.quantity) {
          return callback({
            code: 9, // FAILED_PRECONDITION
            message: `Insufficient stock for product ${product.name}`
          });
        }

        const subtotal = parseFloat(product.price) * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
          product_id: item.product_id,
          product_name: product.name,
          quantity: item.quantity,
          price: parseFloat(product.price),
          subtotal
        });
      }

      // Create order
      const order = await Order.create({
        user_id,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address,
        payment_method
      });

      // Create order items
      for (const item of orderItems) {
        await OrderItem.create({
          order_id: order.id,
          ...item
        });

        // Update product stock
        await Product.decrement('stock_quantity', {
          by: item.quantity,
          where: { id: item.product_id }
        });
      }

      const response = {
        success: true,
        order: {
          id: order.id,
          user_id: order.user_id,
          items: orderItems,
          total_amount: totalAmount,
          status: order.status,
          shipping_address: order.shipping_address,
          payment_method: order.payment_method,
          created_at: order.created_at?.toISOString(),
          updated_at: order.updated_at?.toISOString()
        },
        message: 'Order created successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Create order error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async getOrder(call, callback) {
    try {
      const { id, user_id } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Order ID is required'
        });
      }

      const whereConditions = { id };
      if (user_id) whereConditions.user_id = user_id;

      const order = await Order.findOne({
        where: whereConditions,
        include: [
          {
            model: OrderItem,
            attributes: ['product_id', 'product_name', 'quantity', 'price', 'subtotal']
          }
        ]
      });

      if (!order) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Order not found'
        });
      }

      const response = {
        success: true,
        order: {
          id: order.id,
          user_id: order.user_id,
          items: order.OrderItems?.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            subtotal: parseFloat(item.subtotal)
          })) || [],
          total_amount: parseFloat(order.total_amount),
          status: order.status,
          shipping_address: order.shipping_address,
          payment_method: order.payment_method,
          created_at: order.created_at?.toISOString(),
          updated_at: order.updated_at?.toISOString()
        },
        message: 'Order retrieved successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Get order error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async updateOrder(call, callback) {
    try {
      const { id, user_id, status, shipping_address } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Order ID is required'
        });
      }

      const whereConditions = { id };
      if (user_id) whereConditions.user_id = user_id;

      const order = await Order.findOne({ where: whereConditions });
      if (!order) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Order not found'
        });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (shipping_address) updateData.shipping_address = shipping_address;

      await order.update(updateData);

      const updatedOrder = await Order.findOne({
        where: { id },
        include: [
          {
            model: OrderItem,
            attributes: ['product_id', 'product_name', 'quantity', 'price', 'subtotal']
          }
        ]
      });

      const response = {
        success: true,
        order: {
          id: updatedOrder.id,
          user_id: updatedOrder.user_id,
          items: updatedOrder.OrderItems?.map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: parseFloat(item.price),
            subtotal: parseFloat(item.subtotal)
          })) || [],
          total_amount: parseFloat(updatedOrder.total_amount),
          status: updatedOrder.status,
          shipping_address: updatedOrder.shipping_address,
          payment_method: updatedOrder.payment_method,
          created_at: updatedOrder.created_at?.toISOString(),
          updated_at: updatedOrder.updated_at?.toISOString()
        },
        message: 'Order updated successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Update order error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }

  async deleteOrder(call, callback) {
    try {
      const { id, user_id } = call.request;

      if (!id) {
        return callback({
          code: 3, // INVALID_ARGUMENT
          message: 'Order ID is required'
        });
      }

      const whereConditions = { id };
      if (user_id) whereConditions.user_id = user_id;

      const order = await Order.findOne({ where: whereConditions });
      if (!order) {
        return callback({
          code: 5, // NOT_FOUND
          message: 'Order not found'
        });
      }

      // Delete order items first
      await OrderItem.destroy({ where: { order_id: id } });
      
      // Delete order
      await order.destroy();

      const response = {
        success: true,
        message: 'Order deleted successfully'
      };

      callback(null, response);
    } catch (error) {
      console.error('Delete order error:', error);
      callback({
        code: 13, // INTERNAL
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new OrderService();
