const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// 商品验证规则
const productValidation = [
  body('name').trim().notEmpty().withMessage('商品名称不能为空'),
  body('price').isFloat({ min: 0 }).withMessage('价格必须是大于0的数字'),
  body('stock').isInt({ min: 0 }).withMessage('库存必须是大于等于0的整数'),
  body('category').trim().notEmpty().withMessage('商品分类不能为空')
];

// 创建商品（需要管理员权限）
router.post('/',
  authMiddleware,
  adminMiddleware,
  upload.array('images', 5),
  productValidation,
  productController.createProduct
);

// 获取商品列表
router.get('/', productController.getProducts);

// 获取单个商品详情
router.get('/:id', productController.getProduct);

// 更新商品（需要管理员权限）
router.put('/:id',
  authMiddleware,
  adminMiddleware,
  upload.array('images', 5),
  productController.updateProduct
);

// 删除商品（需要管理员权限）
router.delete('/:id',
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct
);

module.exports = router; 