const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（如果需要）
app.use(express.static(path.join(__dirname, 'public')));

// 导入路由
const authRoutes = require('./routes/auth');

// 使用路由
app.use('/api', authRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '钉钉登录服务运行正常' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📋 健康检查: http://localhost:${PORT}/health`);
}); 