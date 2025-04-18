const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

const router = express.Router();

// 订单验证规则
const orderValidation = [
  body('items').isArray().withMessage('商品列表必须是数组'),
  body('items.*.productId').isInt().withMessage('商品ID必须是整数'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('商品数量必须大于0'),
  body('shippingAddress').notEmpty().withMessage('收货地址不能为空'),
  body('paymentMethod').notEmpty().withMessage('支付方式不能为空'),
  body('shippingMethod').notEmpty().withMessage('配送方式不能为空')
];

// 创建订单
router.post('/',
  authMiddleware,
  orderValidation,
  orderController.createOrder
);

// 获取用户订单列表
router.get('/',
  authMiddleware,
  orderController.getUserOrders
);

// 获取订单详情
router.get('/:id',
  authMiddleware,
  orderController.getOrder
);

// 取消订单
router.post('/:id/cancel',
  authMiddleware,
  orderController.cancelOrder
);

// 更新订单状态（管理员）
router.put('/:id/status',
  authMiddleware,
  adminMiddleware,
  [
    body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
      .withMessage('无效的订单状态'),
    body('trackingNumber').optional().notEmpty()
      .withMessage('物流单号不能为空')
  ],
  orderController.updateOrderStatus
);

module.exports = router; 