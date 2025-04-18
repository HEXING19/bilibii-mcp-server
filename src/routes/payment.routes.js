const express = require('express');
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// 创建支付（支付宝）
router.post('/alipay/create',
  authMiddleware,
  paymentController.createAlipayPayment
);

// 支付宝回调
router.post('/alipay/notify',
  paymentController.alipayCallback
);

// 创建支付（微信）
router.post('/wxpay/create',
  authMiddleware,
  paymentController.createWxPayment
);

// 微信支付回调
router.post('/wxpay/notify',
  paymentController.wxpayCallback
);

// 查询支付状态
router.get('/:orderId/status',
  authMiddleware,
  paymentController.getPaymentStatus
);

module.exports = router; 