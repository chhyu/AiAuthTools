import axios from 'axios';
import { API_BASE_URL } from '@shared/apiConfig';
// import { getToken, removeToken } from './auth'; // 假设存在的token工具函数

// --------------------------
// 项目内部API请求实例（保留原有功能）
// --------------------------
const service = axios.create({
  // 接口地址统一在 src/shared/apiConfig.ts 中维护（测试/正式环境切换只改那一处）。
  baseURL: API_BASE_URL,
  timeout: 60000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 项目内请求拦截器
service.interceptors.request.use(
  config => {
    // 添加项目内token
    // const token = getToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  error => {
    console.error('项目内请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 项目内响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 项目内业务逻辑处理
    if (response.status !== 200) {
      console.error(`请求错误: ${res.msg || '未知错误'}`);
      return Promise.reject(new Error(res.msg || '请求失败'));
    } else {
      return res;
    }
  },
  error => {
    console.error('项目内响应错误:', error);
    
    if (!error.response) {
      console.error('网络错误，请检查网络连接');
      return Promise.reject(new Error('网络错误，请检查网络连接'));
    }
    
    // 项目内错误状态码处理
    const status = error.response.status;
    switch (status) {
      case 401:
        console.error('身份验证失败，请重新登录');
        // removeToken();
        window.location.href = '/login';
        break;
      case 403:
        console.error('没有权限访问');
        break;
      case 404:
        console.error('请求的资源不存在');
        break;
      case 500:
        console.error('服务器内部错误');
        break;
      default:
        console.error(`请求错误，状态码: ${status}`);
    }
    
    return Promise.reject(error);
  }
);

// --------------------------
// 统一封装请求方法
// --------------------------
const http = {
  // 项目内请求方法（保留原有）
  get: (url, params = {}, config = {}) => service.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => service.post(url, data, config),
  put: (url, data = {}, config = {}) => service.put(url, data, config),
  delete: (url, params = {}, config = {}) => service.delete(url, { params, ...config }),
  upload: (url, data, onProgress) => service.post(url, data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent:any) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(percent);
      }
    }
  }),

};

export default http;
    