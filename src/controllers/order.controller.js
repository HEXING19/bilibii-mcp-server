const { Order, OrderItem } = require('../models/order.model');
const Product = require('../models/product.model');
const { validationResult } = require('express-validator');
const sequelize = require('../config/database');

// 创建订单
exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shippingAddress, paymentMethod, shippingMethod } = req.body;

    // 计算总金额并检查库存
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        throw new Error(`商品 ${item.productId} 不存在`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`商品 ${product.name} 库存不足`);
      }
      totalAmount += product.price * item.quantity;
      
      // 更新库存
      await product.update({
        stock: product.stock - item.quantity
      }, { transaction: t });
    }

    // 创建订单
    const order = await Order.create({
      userId: req.user.id,
      totalAmount,
      shippingAddress,
      paymentMethod,
      shippingMethod
    }, { transaction: t });

    // 创建订单项
    const orderItems = await Promise.all(
      items.map(item => OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }, { transaction: t }))
    );

    await t.commit();

    res.status(201).json({
      message: '订单创建成功',
      order: {
        ...order.toJSON(),
        items: orderItems
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('创建订单错误:', error);
    res.status(500).json({ message: error.message || '服务器错误' });
  }
};

// 获取用户订单列表
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        include: [Product]
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      orders: orders.rows,
      total: orders.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(orders.count / limit)
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取订单详情
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      },
      include: [{
        model: OrderItem,
        include: [Product]
      }]
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    res.json(order);
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 取消订单
exports.cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: 'pending'
      },
      include: [OrderItem]
    });

    if (!order) {
      return res.status(404).json({ message: '订单不存在或无法取消' });
    }

    // 恢复库存
    for (const item of order.OrderItems) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.productId },
        transaction: t
      });
    }

    // 更新订单状态
    await order.update({ status: 'cancelled' }, { transaction: t });

    await t.commit();
    res.json({ message: '订单已取消' });
  } catch (error) {
    await t.rollback();
    console.error('取消订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新订单状态（管理员）
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }

    await order.update({
      status,
      trackingNumber: trackingNumber || order.trackingNumber
    });

    res.json({
      message: '订单状态更新成功',
      order
    });
  } catch (error) {
    console.error('更新订单状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 