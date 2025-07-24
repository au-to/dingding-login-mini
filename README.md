# 钉钉登录集成最小全栈项目

本项目演示了如何在企业内部系统中集成钉钉扫码登录和钉钉内免登功能。

## 项目结构

```
dingding-login-mini/
├── backend/                 # 后端服务 (Express.js)
│   ├── routes/
│   │   └── auth.js         # 认证路由
│   ├── package.json
│   ├── server.js           # 服务器入口
│   └── env.example         # 环境变量示例
├── frontend/               # 前端应用 (Vue.js)
│   ├── src/
│   │   ├── utils/
│   │   │   └── api.js      # API调用工具
│   │   ├── App.vue         # 主组件
│   │   └── main.js         # 应用入口
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js      # Vite配置
│   └── env.example         # 环境变量示例
├── package.json            # 根项目配置
└── README.md
```

## 功能特性

✅ **扫码登录**: 生成钉钉登录二维码，用户扫码完成授权登录  
✅ **钉钉内免登**: 在钉钉客户端内自动获取用户身份，无需重复登录  
✅ **用户信息获取**: 获取用户基本信息（姓名、OpenID、UnionID等）  
✅ **统一API接口**: 标准化的REST API设计  
✅ **错误处理**: 完善的错误提示和异常处理  

## 技术栈

### 后端
- **Express.js**: Web服务器框架
- **Axios**: HTTP客户端，调用钉钉API
- **CORS**: 跨域资源共享
- **dotenv**: 环境变量管理

### 前端
- **Vue 3**: 前端框架
- **Element Plus**: UI组件库
- **Vite**: 构建工具
- **Axios**: HTTP客户端

## 快速开始

### 1. 钉钉开发者配置

在开始之前，你需要在钉钉开发者后台完成以下配置：

#### 1.1 创建企业内部应用
1. 登录 [钉钉开发者后台](https://open-dev.dingtalk.com/)
2. 选择你的企业，进入"应用开发"
3. 创建"企业内部应用"
4. 记录下以下信息：
   - **企业ID (CorpId)**: 在"企业信息"中查看
   - **应用凭证 (AppKey/AppSecret)**: 在应用详情页面查看

#### 1.2 配置应用权限
在应用设置中，确保开启以下权限：
- 通讯录个人信息读权限
- 身份验证

#### 1.3 配置回调地址
在应用的"开发配置"中设置登录回调地址：
- 开发环境: `http://localhost:3000/api/login/callback`
- 生产环境: `https://yourdomain.com/api/login/callback`

### 2. 项目安装

```bash
# 克隆项目
git clone <your-repo-url>
cd dingding-login-mini

# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

### 3. 环境配置

#### 3.1 后端配置
```bash
cd backend
cp env.example .env
```

编辑 `.env` 文件，填入你的钉钉应用配置：
```env
PORT=3000
NODE_ENV=development

# 钉钉应用配置
DINGTALK_CORP_ID=你的企业ID
DINGTALK_APP_KEY=你的应用AppKey
DINGTALK_APP_SECRET=你的应用AppSecret
DINGTALK_REDIRECT_URI=http://localhost:3000/api/login/callback
```

#### 3.2 前端配置
```bash
cd frontend
cp env.example .env
```

编辑 `.env` 文件：
```env
VUE_APP_DINGTALK_CORP_ID=你的企业ID
VUE_APP_API_BASE_URL=http://localhost:3000/api
```

### 4. 启动项目

#### 方式一：同时启动前后端（推荐）
```bash
# 在根目录执行
npm run dev
```

#### 方式二：分别启动
```bash
# 启动后端 (端口3000)
cd backend
npm run dev

# 启动前端 (端口8080)
cd frontend
npm run dev
```

### 5. 访问应用

- **前端应用**: http://localhost:8080
- **后端API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health

## API接口说明

### 获取登录二维码
```http
GET /api/login/qrcode
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "https://login.dingtalk.com/oauth2/auth?...",
    "state": "random_string"
  },
  "message": "二维码生成成功"
}
```

### 登录回调处理
```http
GET /api/login/callback?code=xxx&state=xxx
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "user": {
      "openId": "user_open_id",
      "nick": "用户姓名",
      "unionId": "user_union_id"
    },
    "accessToken": "access_token",
    "state": "state_value"
  },
  "message": "登录成功"
}
```

### 钉钉内免登
```http
POST /api/login/dingtalk_inner
Content-Type: application/json

{
  "authCode": "auth_code_from_dingtalk"
}
```

**响应示例:**
```json
{
  "success": true,
  "data": {
    "user": {
      "openId": "user_open_id",
      "nick": "用户姓名",
      "mobile": "手机号"
    },
    "loginType": "dingtalk_inner"
  },
  "message": "免登成功"
}
```

## 使用场景

### 扫码登录流程
1. 用户在PC端打开应用
2. 点击"获取登录二维码"按钮
3. 前端调用 `/api/login/qrcode` 获取登录URL
4. 使用钉钉登录SDK显示二维码
5. 用户使用钉钉扫码
6. 钉钉重定向到 `/api/login/callback`
7. 后端处理授权码，获取用户信息
8. 返回用户信息给前端

### 钉钉内免登流程
1. 用户在钉钉客户端内打开应用
2. 前端检测到钉钉环境，自动调用钉钉JSAPI
3. 获取免登授权码 (authCode)
4. 前端调用 `/api/login/dingtalk_inner` 传递authCode
5. 后端使用authCode获取用户信息
6. 返回用户信息给前端

## 开发注意事项

### 钉钉API版本
本项目使用钉钉开放平台新版API (v1.0)，请确保：
- 使用正确的API端点
- 传递正确的请求头格式
- 处理API返回的错误码

### 安全考虑
1. **AppSecret保护**: 绝不要在前端暴露AppSecret
2. **HTTPS**: 生产环境必须使用HTTPS
3. **State参数**: 扫码登录使用state参数防止CSRF攻击
4. **Token管理**: 及时刷新和管理访问令牌

### 常见问题

**Q: 二维码生成失败？**  
A: 检查AppKey/AppSecret是否正确，确认回调地址已在钉钉后台配置

**Q: 免登失败？**  
A: 确认企业ID正确，检查应用权限设置，确保在钉钉客户端内访问

**Q: 回调接口404？**  
A: 检查回调地址配置，确保后端服务正常运行

**Q: 跨域问题？**  
A: 前端已配置代理，确保前端端口(8080)访问后端端口(3000)

## 部署到生产环境

### 环境变量配置
```env
NODE_ENV=production
PORT=3000
DINGTALK_CORP_ID=你的企业ID
DINGTALK_APP_KEY=你的应用AppKey
DINGTALK_APP_SECRET=你的应用AppSecret
DINGTALK_REDIRECT_URI=https://yourdomain.com/api/login/callback
```

### 构建前端
```bash
cd frontend
npm run build
```

### 启动后端
```bash
cd backend
npm start
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 相关链接

- [钉钉开放平台文档](https://open.dingtalk.com/)
- [钉钉登录SDK文档](https://open.dingtalk.com/document/orgapp-client/tutorial-obtaining-user-personal-information)
- [Vue 3 官方文档](https://vuejs.org/)
- [Express.js 官方文档](https://expressjs.com/)
