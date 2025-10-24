import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Axios Agent - 統一的 HTTP 請求代理
 * 職責：管理 HTTP 請求、錯誤處理、請求攔截
 */
class AxiosAgent {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * 設定請求和回應攔截器
   */
  private setupInterceptors(): void {
    // 請求攔截器
    this.instance.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        console.error('[AxiosAgent] 請求錯誤:', error);
        return Promise.reject(error);
      }
    );

    // 回應攔截器
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('[AxiosAgent] 回應錯誤:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET 請求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  /**
   * POST 請求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * PUT 請求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * DELETE 請求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  /**
   * 取得 Axios 實例 (需要進階配置時使用)
   */
  getInstance(): AxiosInstance {
    return this.instance;
  }
}

// 匯出單例實例
export const axiosAgent = new AxiosAgent();