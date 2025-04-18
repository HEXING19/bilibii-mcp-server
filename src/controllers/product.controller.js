const Product = require('../models/product.model');
const { validationResult } = require('express-validator');
const OSS = require('ali-oss');

// 配置阿里云OSS
const ossClient = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
});

// 创建商品
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock, category, barcode } = req.body;
    const images = req.files ? await uploadImages(req.files) : [];

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      barcode,
      images
    });

    res.status(201).json({
      message: '商品创建成功',
      product
    });
  } catch (error) {
    console.error('创建商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取商品列表
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;
    
    let where = { status: 'active' };
    if (category) {
      where.category = category;
    }
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const products = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      products: products.rows,
      total: products.count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(products.count / limit)
    });
  } catch (error) {
    console.error('获取商品列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个商品详情
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json(product);
  } catch (error) {
    console.error('获取商品详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新商品信息
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }

    const { name, description, price, stock, category, status } = req.body;
    const images = req.files ? await uploadImages(req.files) : product.images;

    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      stock: stock || product.stock,
      category: category || product.category,
      status: status || product.status,
      images: images
    });

    res.json({
      message: '商品更新成功',
      product
    });
  } catch (error) {
    console.error('更新商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除商品
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }

    // 软删除：将状态改为inactive
    await product.update({ status: 'inactive' });

    res.json({ message: '商品删除成功' });
  } catch (error) {
    console.error('删除商品错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 上传图片到阿里云OSS
async function uploadImages(files) {
  const uploadPromises = files.map(async (file) => {
    const filename = `products/${Date.now()}-${file.originalname}`;
    try {
      const result = await ossClient.put(filename, file.buffer);
      return result.url;
    } catch (error) {
      console.error('上传图片错误:', error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
} 