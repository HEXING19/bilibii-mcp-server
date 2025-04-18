const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// 注册验证规则
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('用户名至少需要3个字符'),
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').isLength({ min: 6 }).withMessage('密码至少需要6个字符'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('请输入有效的手机号码')
];

// 注册路由
router.post('/register', registerValidation, userController.register);

// 登录路由
router.post('/login', [
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').exists().withMessage('请输入密码')
], userController.login);

// 获取用户信息（需要认证）
router.get('/profile', authMiddleware, userController.getProfile);

// 更新用户信息（需要认证）
router.put('/profile', authMiddleware, [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('用户名至少需要3个字符'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('请输入有效的手机号码'),
  body('address').optional().trim().notEmpty().withMessage('地址不能为空')
], userController.updateProfile);

module.exports = router; 