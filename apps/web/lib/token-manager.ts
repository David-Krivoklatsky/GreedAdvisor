// Token management utility
export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'accessToken';

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static removeAccessToken(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
  }

  static async refreshAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  static async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken();

    if (!token) {
      // Redirect to login if no token
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('No access token available');
    }

    // First attempt with current token
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    // If token is expired, try to refresh
    if (response.status === 401) {
      token = await this.refreshAccessToken();

      if (!token) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          this.removeAccessToken();
          window.location.href = '/login';
        }
        throw new Error('Authentication failed');
      }

      // Retry the request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return response;
  }

  static async logout(): Promise<void> {
    this.removeAccessToken();

    // Clear refresh token cookie
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  }
}
