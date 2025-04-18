const axios = require('axios');
const crypto = require('crypto');

// 快递100配置
const kuaidi100Config = {
  key: process.env.KUAIDI100_KEY,
  customer: process.env.KUAIDI100_CUSTOMER,
  apiUrl: 'https://poll.kuaidi100.com/poll/query.do'
};

// 查询物流信息
exports.trackShipment = async (trackingNumber, carrier) => {
  try {
    const params = {
      com: carrier,           // 快递公司编码
      num: trackingNumber,    // 快递单号
      phone: '',             // 手机号（选填）
      from: '',              // 出发地（选填）
      to: '',                // 目的地（选填）
      resultv2: 1            // 返回结果为新版本
    };

    // 生成签名
    const sign = generateSignature(params);

    const requestData = {
      customer: kuaidi100Config.customer,
      sign: sign,
      param: JSON.stringify(params)
    };

    const response = await axios.post(kuaidi100Config.apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.message === 'ok') {
      return {
        success: true,
        trackingInfo: formatTrackingInfo(response.data.data)
      };
    } else {
      throw new Error(response.data.message || '查询物流信息失败');
    }
  } catch (error) {
    console.error('查询物流信息错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 订阅物流更新
exports.subscribeShipmentUpdates = async (trackingNumber, carrier, callbackUrl) => {
  try {
    const params = {
      company: carrier,
      number: trackingNumber,
      key: kuaidi100Config.key,
      parameters: {
        callbackurl: callbackUrl,
        salt: generateRandomString(8),
        resultv2: 1
      }
    };

    const response = await axios.post(
      'https://poll.kuaidi100.com/poll',
      params,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: response.data.result,
      message: response.data.message
    };
  } catch (error) {
    console.error('订阅物流更新错误:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 验证物流回调
exports.verifyCallback = (params, signature) => {
  const calculatedSignature = generateSignature(params);
  return calculatedSignature === signature;
};

// 生成签名
function generateSignature(params) {
  const param = JSON.stringify(params);
  const signStr = param + kuaidi100Config.key + kuaidi100Config.customer;
  return crypto.createHash('md5')
    .update(signStr)
    .digest('hex')
    .toUpperCase();
}

// 格式化物流信息
function formatTrackingInfo(data) {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    time: item.time,
    location: item.location || '',
    status: item.status,
    description: item.context
  }));
}

// 生成随机字符串
function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length);
} 