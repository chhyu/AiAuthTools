import axios from 'axios';
// import { getToken, removeToken } from './auth'; // 假设存在的token工具函数

// --------------------------
// 项目内部API请求实例（保留原有功能）
// --------------------------
const service = axios.create({
  baseURL: 'http://124.222.45.42:24433', 
  // baseURL: 'http://localhost:5555',
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
// 第三方API请求实例（新增）
// --------------------------
const thirdPartyService = axios.create({
  timeout: 15000, // 第三方请求超时时间可适当延长
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
    // 不自动添加项目内token，保持纯净
  }
});

// 第三方请求拦截器（按需配置）
thirdPartyService.interceptors.request.use(
  config => {
    // 第三方请求不自动添加项目token，但保留扩展能力
    return config;
  },
  error => {
    console.error('第三方请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 第三方响应拦截器（通用错误处理）
thirdPartyService.interceptors.response.use(
  response => {
    // 第三方响应不做业务逻辑判断，直接返回原始数据
    // 避免与第三方接口的状态码/格式冲突
    return response.data;
  },
  error => {
    console.error('第三方响应错误:', error);
    
    if (!error.response) {
      console.error('第三方请求网络错误');
      return Promise.reject(new Error('第三方请求网络错误'));
    }
    
    // 第三方错误仅做通用提示，不做业务处理
    return Promise.reject(new Error(`第三方请求失败: ${error.response.status}`));
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
  
  // 第三方请求方法（新增）
  thirdParty: {
    /**
     * 第三方GET请求
     * @param {string} url 完整的第三方URL
     * @param {object} params 请求参数
     * @param {object} config 额外配置，可包含headers
     */
    get: (url, params = {}, config = {}) => thirdPartyService.get(url, { params, ...config }),
    
    /**
     * 第三方POST请求
     * @param {string} url 完整的第三方URL
     * @param {object} data 请求数据
     * @param {object} config 额外配置，可包含headers
     */
    post: (url, data = {}, config = {}) => thirdPartyService.post(url, data, config),
    
    /**
     * 第三方PUT请求
     * @param {string} url 完整的第三方URL
     * @param {object} data 请求数据
     * @param {object} config 额外配置，可包含headers
     */
    put: (url, data = {}, config = {}) => thirdPartyService.put(url, data, config),
    
    /**
     * 第三方DELETE请求
     * @param {string} url 完整的第三方URL
     * @param {object} params 请求参数
     * @param {object} config 额外配置，可包含headers
     */
    delete: (url, params = {}, config = {}) => thirdPartyService.delete(url, { params, ...config })
  }
};

export default http;
    