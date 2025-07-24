const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

const router = express.Router();

// 钉钉API配置
const DINGTALK_CONFIG = {
  corpId: process.env.DINGTALK_CORP_ID,
  appKey: process.env.DINGTALK_APP_KEY,
  appSecret: process.env.DINGTALK_APP_SECRET,
  redirectUri: process.env.DINGTALK_REDIRECT_URI || 'http://localhost:3000/api/login/callback'
};

// 验证配置是否完整
function validateConfig() {
  const required = ['corpId', 'appKey', 'appSecret'];
  const missing = required.filter(key => !DINGTALK_CONFIG[key]);
  
  if (missing.length > 0) {
    throw new Error(`缺少必要的钉钉配置: ${missing.join(', ')}`);
  }
}

/**
 * 生成钉钉登录二维码
 * GET /api/login/qrcode
 */
router.get('/login/qrcode', async (req, res) => {
  try {
    validateConfig();

    // 生成随机state参数用于防止CSRF攻击
    const state = crypto.randomBytes(16).toString('hex');
    
    // 构建钉钉授权URL
    const authUrl = 'https://login.dingtalk.com/oauth2/auth?' + querystring.stringify({
      client_id: DINGTALK_CONFIG.appKey,
      response_type: 'code',
      scope: 'openid',
      state: state,
      redirect_uri: DINGTALK_CONFIG.redirectUri,
      prompt: 'consent'
    });

    res.json({
      success: true,
      data: {
        qrCodeUrl: authUrl,
        state: state
      },
      message: '二维码生成成功'
    });

  } catch (error) {
    console.error('生成二维码失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 处理钉钉登录回调
 * GET /api/login/callback
 */
router.get('/login/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: '缺少授权码'
      });
    }

    validateConfig();

    // 1. 使用授权码获取访问令牌
    const tokenResponse = await axios.post('https://api.dingtalk.com/v1.0/oauth2/userAccessToken', {
      clientId: DINGTALK_CONFIG.appKey,
      clientSecret: DINGTALK_CONFIG.appSecret,
      code: code,
      grantType: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { accessToken } = tokenResponse.data;

    // 2. 使用访问令牌获取用户信息
    const userResponse = await axios.get('https://api.dingtalk.com/v1.0/contact/users/me', {
      headers: {
        'x-acs-dingtalk-access-token': accessToken
      }
    });

    const userInfo = userResponse.data;

    // 这里可以添加你的业务逻辑，比如：
    // - 检查用户是否存在于数据库
    // - 创建用户会话
    // - 生成JWT token等

    res.json({
      success: true,
      data: {
        user: userInfo,
        accessToken: accessToken,
        state: state
      },
      message: '登录成功'
    });

  } catch (error) {
    console.error('回调处理失败:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

/**
 * 钉钉内免登
 * POST /api/login/dingtalk_inner
 */
router.post('/login/dingtalk_inner', async (req, res) => {
  try {
    const { authCode } = req.body;

    if (!authCode) {
      return res.status(400).json({
        success: false,
        error: '缺少authCode参数'
      });
    }

    validateConfig();

    // 1. 获取企业访问令牌
    const tokenResponse = await axios.post('https://api.dingtalk.com/v1.0/oauth2/accessToken', {
      appKey: DINGTALK_CONFIG.appKey,
      appSecret: DINGTALK_CONFIG.appSecret
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { accessToken } = tokenResponse.data;

    // 2. 根据authCode获取用户信息
    const userResponse = await axios.post('https://api.dingtalk.com/v1.0/contact/users/me', {
      code: authCode
    }, {
      headers: {
        'x-acs-dingtalk-access-token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    const userInfo = userResponse.data;

    // 这里可以添加你的业务逻辑
    // - 验证用户权限
    // - 生成内部会话等

    res.json({
      success: true,
      data: {
        user: userInfo,
        loginType: 'dingtalk_inner'
      },
      message: '免登成功'
    });

  } catch (error) {
    console.error('钉钉内免登失败:', error);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

module.exports = router; 