import axios from 'axios';

// 测试B站API
async function testBilibiliAPI(uid) {
  console.log(`测试用户ID: ${uid}`);
  
  try {
    // 模拟浏览器请求
    const url = `https://api.bilibili.com/x/web-interface/card?mid=${uid}&jsonp=jsonp`;
    console.log(`请求URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'Referer': `https://space.bilibili.com/${uid}/`,
        'Accept': 'application/json, text/plain, */*'
      }
    });
    
    console.log(`状态码: ${response.status}`);
    console.log(`响应数据:`);
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data && response.data.data.follower !== undefined) {
      console.log(`用户: ${response.data.data.card.name}`);
      console.log(`粉丝数: ${response.data.data.follower}`);
      return true;
    } else {
      console.error('找不到粉丝数');
      return false;
    }
  } catch (error) {
    console.error('出错了:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.status, error.response.data);
    }
    return false;
  }
}

// 测试多个UID
async function runTests() {
  const uids = [
    '184594996', // 何19
    '163637592'  // 何同学
  ];
  
  for (const uid of uids) {
    console.log(`\n============= 测试 ${uid} =============`);
    const success = await testBilibiliAPI(uid);
    console.log(`测试结果: ${success ? '成功' : '失败'}`);
  }
}

// 运行测试
runTests().catch(console.error); 