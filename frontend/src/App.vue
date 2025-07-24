<template>
  <div id="app">
    <el-container class="app-container">
      <el-header class="app-header">
        <h1>钉钉登录集成演示</h1>
      </el-header>
      
      <el-main class="app-main">
        <!-- 登录状态显示 -->
        <el-card v-if="userInfo" class="user-info-card">
          <template #header>
            <div class="card-header">
              <span>用户信息</span>
              <el-button type="primary" @click="logout">退出登录</el-button>
            </div>
          </template>
          <div class="user-info">
            <p><strong>姓名:</strong> {{ userInfo.nick }}</p>
            <p><strong>用户ID:</strong> {{ userInfo.openId }}</p>
            <p><strong>登录方式:</strong> {{ loginType }}</p>
            <el-divider />
            <el-descriptions title="详细信息" border>
              <el-descriptions-item label="OpenID">{{ userInfo.openId }}</el-descriptions-item>
              <el-descriptions-item label="UnionID">{{ userInfo.unionId || '无' }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ userInfo.mobile || '无' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userInfo.email || '无' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <!-- 登录选项 -->
        <el-card v-else class="login-card">
          <template #header>
            <span>选择登录方式</span>
          </template>
          
          <div class="login-options">
            <!-- 扫码登录 -->
            <div class="login-section">
              <h3>扫码登录</h3>
              <p>适用于PC端或移动端浏览器</p>
              <el-button 
                type="primary" 
                @click="initQRLogin"
                :loading="qrLoginLoading"
                size="large"
              >
                获取登录二维码
              </el-button>
              
              <!-- 二维码显示区域 -->
              <div v-if="qrCodeUrl" class="qr-code-container">
                <div id="qr-login-container"></div>
                <p class="qr-tip">请使用钉钉扫描二维码登录</p>
              </div>
            </div>

            <el-divider />

            <!-- 钉钉内免登 -->
            <div class="login-section">
              <h3>钉钉内免登</h3>
              <p>在钉钉客户端内打开时自动获取登录信息</p>
              <el-button 
                type="success" 
                @click="checkDingTalkInner"
                :loading="innerLoginLoading"
                size="large"
              >
                检测钉钉环境
              </el-button>
              
              <div v-if="isDingTalkClient" class="dingtalk-inner-info">
                <el-alert
                  title="检测到钉钉环境"
                  type="success"
                  description="正在尝试获取免登信息..."
                  :closable="false"
                />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 错误信息显示 -->
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          @close="errorMessage = ''"
          style="margin-top: 20px"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from './utils/api'

export default {
  name: 'App',
  setup() {
    // 响应式数据
    const userInfo = ref(null)
    const loginType = ref('')
    const qrCodeUrl = ref('')
    const qrLoginLoading = ref(false)
    const innerLoginLoading = ref(false)
    const isDingTalkClient = ref(false)
    const errorMessage = ref('')

    // 检查是否在钉钉客户端内
    const checkDingTalkInner = async () => {
      innerLoginLoading.value = true
      
      try {
        // 检测钉钉环境
        if (typeof window.dd !== 'undefined') {
          isDingTalkClient.value = true
          
          // 获取免登授权码
          window.dd.runtime.permission.requestAuthCode({
            corpId: process.env.VUE_APP_DINGTALK_CORP_ID || 'your_corp_id',
            onSuccess: async (result) => {
              try {
                const response = await api.dingtalkInnerLogin(result.code)
                if (response.success) {
                  userInfo.value = response.data.user
                  loginType.value = '钉钉内免登'
                  ElMessage.success('免登成功！')
                } else {
                  throw new Error(response.error)
                }
              } catch (error) {
                errorMessage.value = `免登失败: ${error.message}`
                ElMessage.error('免登失败')
              }
            },
            onFail: (err) => {
              errorMessage.value = `获取授权码失败: ${err.message}`
              ElMessage.error('获取授权码失败')
            }
          })
        } else {
          isDingTalkClient.value = false
          ElMessage.warning('当前不在钉钉客户端环境中')
        }
      } catch (error) {
        errorMessage.value = `检测钉钉环境失败: ${error.message}`
        ElMessage.error('检测失败')
      } finally {
        innerLoginLoading.value = false
      }
    }

    // 初始化二维码登录
    const initQRLogin = async () => {
      qrLoginLoading.value = true
      
      try {
        const response = await api.getQRCode()
        if (response.success) {
          qrCodeUrl.value = response.data.qrCodeUrl
          
          // 使用钉钉登录SDK创建二维码
          window.DDLogin({
            id: 'qr-login-container',
            goto: response.data.qrCodeUrl,
            style: 'border:none;background-color:#FFFFFF;',
            width: '365',
            height: '400'
          })
          
          ElMessage.success('二维码生成成功，请扫描登录')
        } else {
          throw new Error(response.error)
        }
      } catch (error) {
        errorMessage.value = `获取二维码失败: ${error.message}`
        ElMessage.error('获取二维码失败')
      } finally {
        qrLoginLoading.value = false
      }
    }

    // 退出登录
    const logout = () => {
      userInfo.value = null
      loginType.value = ''
      qrCodeUrl.value = ''
      isDingTalkClient.value = false
      ElMessage.success('已退出登录')
    }

    // 处理URL回调（扫码登录成功后的回调）
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      
      if (code) {
        // 清理URL参数
        window.history.replaceState({}, document.title, window.location.pathname)
        
        // 这里可以调用后端接口处理回调
        // 实际应用中，这个处理通常在后端完成
        ElMessage.success('扫码登录成功！')
      }
    }

    // 组件挂载时检查回调参数
    onMounted(() => {
      handleCallback()
      
      // 如果在钉钉环境中，自动尝试免登
      if (typeof window.dd !== 'undefined') {
        setTimeout(() => {
          checkDingTalkInner()
        }, 1000)
      }
    })

    return {
      userInfo,
      loginType,
      qrCodeUrl,
      qrLoginLoading,
      innerLoginLoading,
      isDingTalkClient,
      errorMessage,
      checkDingTalkInner,
      initQRLogin,
      logout
    }
  }
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.app-header {
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-main {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.user-info-card,
.login-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-options {
  padding: 20px 0;
}

.login-section {
  text-align: center;
  margin: 20px 0;
}

.login-section h3 {
  color: #303133;
  margin-bottom: 10px;
}

.login-section p {
  color: #606266;
  margin-bottom: 20px;
}

.qr-code-container {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 14px;
}

.dingtalk-inner-info {
  margin-top: 20px;
}

.user-info p {
  margin: 10px 0;
  font-size: 16px;
}
</style> 