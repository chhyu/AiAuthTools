// 主进程：处理请求拦截和动态参数
const { session } = require('electron')
const { ipcMain } = require('electron')

// 存储动态请求参数
let dynamicRequestConfig = {
  urls: [],
  cookies: {},
  referers: {}
}

// 监听渲染进程发送的动态参数
ipcMain.on('set-dynamic-request-config', (event, config) => {
  dynamicRequestConfig = { ...dynamicRequestConfig, ...config }
  
  // 重新设置拦截器
  setupRequestInterceptor()
})

// 设置请求拦截器
function setupRequestInterceptor() {
  // 先移除已有的拦截器
  session.defaultSession.webRequest.onBeforeSendHeaders(null, () => {})
  
  // 添加新的拦截器
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: dynamicRequestConfig.urls },
    (details, callback) => {
      // 复制现有请求头
      const headers = { ...details.requestHeaders }
      
      // 动态设置Referer
      const urlKey = dynamicRequestConfig.urls.find(url => 
        details.url.startsWith(url.replace('*', ''))
      )
      
      if (urlKey && dynamicRequestConfig.referers[urlKey]) {
        headers.Referer = dynamicRequestConfig.referers[urlKey]
      }
      
      // 动态设置Cookie
      if (urlKey && dynamicRequestConfig.cookies[urlKey]) {
        headers.Cookie = dynamicRequestConfig.cookies[urlKey]
      }
      
      callback({ requestHeaders: headers })
    }
  )
}

// 初始化拦截器
setupRequestInterceptor()

module.exports = { setupRequestInterceptor }
    