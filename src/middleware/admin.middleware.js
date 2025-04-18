const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' });
    }
    
    next();
  } catch (error) {
    console.error('管理员验证错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
}; 