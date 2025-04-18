import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from 'axios';
import { z } from "zod";
import https from 'https';
import fs from 'fs';

// 创建B站API服务
class BilibiliService {
  // 创建一个axios实例，配置超时和重试
  constructor() {
    // 创建日志目录
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
    }
    
    // 启用axios请求调试
    axios.interceptors.request.use(request => {
      console.log('=========== Request Start ===========');
      console.log('Request:', request.method, request.url);
      console.log('Request Headers:', JSON.stringify(request.headers));
      console.log('Request Data:', request.data);
      console.log('=========== Request End =============');
      return request;
    });
    
    axios.interceptors.response.use(
      response => {
        console.log('=========== Response Start ===========');
        console.log('Response Status:', response.status);
        console.log('Response Headers:', JSON.stringify(response.headers));
        console.log('Response Data:', JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
        console.log('=========== Response End =============');
        return response;
      },
      error => {
        console.log('=========== Response Error ===========');
        if (error.response) {
          console.log('Error Status:', error.response.status);
          console.log('Error Headers:', JSON.stringify(error.response.headers));
          console.log('Error Data:', JSON.stringify(error.response.data));
        } else {
          console.log('Error:', error.message);
        }
        console.log('=========== Error End =============');
        return Promise.reject(error);
      }
    );
    
    this.axios = axios.create({
      timeout: 10000,
      httpsAgent: new https.Agent({ 
        keepAlive: true,
        rejectUnauthorized: false
      }),
      decompress: false
    });
    
    // 随机延迟以避免频率限制
    this.axios.interceptors.request.use(async (config) => {
      const delay = Math.floor(Math.random() * 1000) + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      return config;
    });
  }
  
  // 随机生成请求头
  getHeaders(uid = '') {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
    
    // 确保有指定的Referer，指向用户空间页面
    const referer = uid ? `https://space.bilibili.com/${uid}` : 'https://space.bilibili.com/';
    
    return {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      'Referer': referer,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Origin': 'https://space.bilibili.com',
      'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Cookie': 'buvid3=35593D46-A6EC-8B27-E044-12E96D0399A128687infoc;'
    };
  }

  // 检查是否是数字UID
  isUid(input) {
    return /^\d+$/.test(input) && input.length > 4 && input.length < 12;
  }
  
  // 根据用户ID获取粉丝数 (使用官方API)
  async getFansCountByUid(uid) {
    try {
      console.log(`=== 开始获取用户 ${uid} 的粉丝数 ===`);
      
      // 使用简单请求，完全匹配测试脚本的方式
      const url = `https://api.bilibili.com/x/web-interface/card?mid=${uid}&jsonp=jsonp`;
      console.log(`请求API: ${url}`);
      
      // 使用与测试脚本完全相同的请求头
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
          'Referer': `https://space.bilibili.com/${uid}/`,
          'Accept': 'application/json, text/plain, */*'
        }
      });
      
      console.log(`收到响应: 状态码 ${response.status}`);
      
      // 简化处理逻辑，与测试脚本一致
      if (response.data && response.data.data && response.data.data.follower !== undefined) {
        const username = response.data.data.card?.name || `UID:${uid}`;
        const follower = response.data.data.follower;
        
        console.log(`成功: ${username} 的粉丝数为 ${follower}`);
        return {
          success: true,
          username: username,
          followerCount: follower,
          userId: uid
        };
      }
      
      // 如果找不到所需数据，记录完整响应
      console.error('响应格式不符合预期:', JSON.stringify(response.data, null, 2));
      return { 
        success: false, 
        error: `数据格式错误: 响应中没有找到粉丝数据` 
      };
    } catch (error) {
      // 详细记录错误
      console.error('捕获到异常:', error.message);
      if (error.response) {
        console.error('错误响应状态码:', error.response.status);
        console.error('错误响应数据:', JSON.stringify(error.response.data));
      }
      
      return { 
        success: false, 
        error: `请求异常: ${error.message}` 
      };
    }
  }
  
  // 记录错误日志
  logError(message, error = null) {
    try {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message}\n`;
      const logPath = `./logs/error_${new Date().toISOString().split('T')[0]}.log`;
      
      fs.appendFileSync(logPath, logMessage);
      
      if (error && error.response) {
        const responseData = `Response Data: ${JSON.stringify(error.response.data)}\n`;
        fs.appendFileSync(logPath, responseData);
      }
    } catch (e) {
      console.error('写入日志出错:', e);
    }
  }
  
  // 获取用户粉丝数量 - 主方法 (简化版)
  async getFollowerCount(input) {
    try {
      console.log(`处理输入: ${input}`);
      
      // 清理输入
      let uid = input.trim();
      
      // 如果是URI格式，提取用户ID
      if (uid.includes('://')) {
        const parts = uid.split('/');
        uid = parts.pop() || parts.pop() || '';
        console.log(`从URI提取UID: ${uid}`);
      }
      
      // 确保是纯数字
      if (!/^\d+$/.test(uid)) {
        return { 
          success: false, 
          error: `输入无效: ${uid} 不是有效的B站用户ID` 
        };
      }
      
      // 直接调用获取粉丝数的方法
      return await this.getFansCountByUid(uid);
    } catch (error) {
      console.error('处理过程异常:', error);
      return { 
        success: false, 
        error: `处理异常: ${error.message}` 
      };
    }
  }
}

// 创建B站服务实例
const bilibiliService = new BilibiliService();

// 创建MCP服务器
const server = new Server({
  name: "bilibili-followers",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

// 定义获取粉丝数量的工具
const TOOLS = {
  getBilibiliFollowerCount: {
    name: "getBilibiliFollowerCount",
    description: "获取B站用户的粉丝数量",
    schema: {
      type: "object",
      properties: {
        userId: {
          type: "string",
          description: "B站用户ID（数字ID，如163637592）"
        }
      },
      required: ["userId"]
    }
  }
};

// 定义请求模式
const toolsListSchema = z.object({
  method: z.literal("tools/list")
});

const toolsCallSchema = z.object({
  method: z.literal("tools/call"),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.unknown()).optional()
  })
});

const toolDescribeSchema = z.object({
  method: z.literal("tool/describe"),
  params: z.object({
    name: z.string()
  })
});

// 当工具列表被请求时
server.setRequestHandler(toolsListSchema, async (req) => {
  console.log("Tools list requested");
  return {
    tools: [
      {
        name: TOOLS.getBilibiliFollowerCount.name,
        description: TOOLS.getBilibiliFollowerCount.description,
        inputSchema: TOOLS.getBilibiliFollowerCount.schema,
        outputSchema: {
          type: "object",
          properties: {
            username: { type: "string" },
            followerCount: { type: "number" }
          }
        }
      }
    ]
  };
});

// 当工具被调用时 (使用tools/call方法)
server.setRequestHandler(toolsCallSchema, async (req) => {
  const { name, arguments: args } = req.params;
  console.log(`Tool call requested: ${name}`, args);

  // 处理B站粉丝查询工具
  if (name === TOOLS.getBilibiliFollowerCount.name) {
    const { userId } = args || {};

    // 验证输入
    if (!userId) {
      return { error: "用户ID不能为空" };
    }
    
    // 验证输入是否为数字ID
    if (!/^\d+$/.test(userId.trim())) {
      return { 
        error: "请输入有效的B站用户ID（纯数字，如163637592）" 
      };
    }

    // 调用B站API获取粉丝数
    console.log(`开始获取B站用户信息: ${userId}`);
    const result = await bilibiliService.getFollowerCount(userId);

    if (result.success) {
      // 成功响应
      const response = {
        result: {
          username: result.username,
          followerCount: result.followerCount
        }
      };
      console.log(`成功获取粉丝数据:`, response);
      return response;
    } else {
      // 失败响应
      const errorResponse = {
        error: result.error
      };
      console.log(`获取粉丝数据失败:`, errorResponse);
      return errorResponse;
    }
  }

  // 未知工具
  return {
    error: `未知工具: ${name}`
  };
});

// 当工具详情被请求时
server.setRequestHandler(toolDescribeSchema, async (req) => {
  const { name } = req.params;
  console.log(`Tool description requested: ${name}`);

  if (name === TOOLS.getBilibiliFollowerCount.name) {
    return {
      name: TOOLS.getBilibiliFollowerCount.name,
      description: TOOLS.getBilibiliFollowerCount.description,
      parameters: TOOLS.getBilibiliFollowerCount.schema
    };
  }

  return { error: `Tool not found: ${name}` };
});

// 启动服务器
async function main() {
  try {
    console.log("Starting Bilibili follower count MCP server...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP server connected and running!");
    console.log("Use Inspector to access the getBilibiliFollowerCount tool");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main(); 