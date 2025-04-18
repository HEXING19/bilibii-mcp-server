# Bilibili 粉丝数查询 MCP 服务

这是一个基于Model Context Protocol (MCP)的服务，用于查询B站用户的粉丝数量。通过提供B站用户ID，可以获取该用户的粉丝数。

## 功能特点

- 通过用户ID直接查询B站用户粉丝数
- 支持MCP协议，可与Claude、GPT等大模型集成
- 支持错误处理和详细日志记录

## 安装方法

### 前置要求

- Node.js v16.0.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆或下载本仓库
2. 进入项目目录并安装依赖

```bash
cd bilibili-mcp-server
npm install
```

## 使用方法

### 启动服务器

```bash
npm start
```

启动成功后，终端会显示：
```
Starting Bilibili follower count MCP server...
MCP server connected and running!
Use Inspector to access the getBilibiliFollowerCount tool
```

### 使用MCP Inspector测试

1. 安装MCP Inspector (如果尚未安装)
2. 将Inspector连接到本地MCP服务器
3. 选择`getBilibiliFollowerCount`工具
4. 输入参数：
   - `userId`: B站用户的数字ID (如：`184594996`，`163637592`等)
5. 点击"Run"执行查询

### 输出格式

成功响应:
```json
{
  "result": {
    "username": "用户名",
    "followerCount": 12345
  }
}
```

错误响应:
```json
{
  "error": "错误信息"
}
```

## API参考

### getBilibiliFollowerCount

获取B站用户的粉丝数量。

**参数:**
- `userId` (必填): B站用户ID，纯数字，通常为7-10位，如"163637592"

**返回值:**
- `username`: 用户名
- `followerCount`: 粉丝数量

## 如何获取B站用户ID

B站用户ID可以通过以下方式获取：

1. 访问用户空间页面，查看URL
   - 例如：https://space.bilibili.com/163637592 中的 163637592 即为用户ID

2. 在B站搜索用户名，点击进入用户空间，查看URL中的数字ID

## 常见问题

### Q: 为什么需要使用用户ID而不是用户名?
A: B站API直接支持通过用户ID查询，这种方式更加可靠和高效。用户名可能重复或变更，而ID是唯一的。

### Q: 如何处理API请求失败?
A: 服务会自动重试并记录详细错误日志，您可以在`logs`目录中查看错误详情。

## 测试工具

项目包含一个测试脚本，用于直接测试B站API:

```bash
node test-api.js
```

这将测试几个预设的用户ID，并显示详细的响应结果。

## 许可证

MIT 