/**
 * VisaFlow AI — API Client
 * Coordinates all HTTP fetch requests between Frontend and NestJS Server.
 * Automatically handles JWT Bearer authentication and Tenant security headers.
 */

export class ApiClient {
  private static getHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('visaflow_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
      const tenantId = localStorage.getItem('visaflow_tenant_id');
      if (tenantId) {
        defaultHeaders['x-tenant-id'] = tenantId;
      }
    }

    return defaultHeaders;
  }

  static async get<T>(path: string, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(customHeaders),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }

    return response.json();
  }

  static async post<T>(path: string, body: any, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }

    return response.json();
  }

  static async put<T>(path: string, body: any, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }

    return response.json();
  }

  static async delete<T>(path: string, customHeaders: Record<string, string> = {}): Promise<T> {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}${path}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(customHeaders),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API Request failed' }));
      throw new Error(err.message || 'API Request failed');
    }

    return response.json();
  }
}
