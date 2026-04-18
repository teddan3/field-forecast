const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class FieldForecastApi {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async trackReferral(referralCode) {
    return this.request('/auth/track-referral', {
      method: 'POST',
      body: JSON.stringify({ referral_code: referralCode }),
    });
  }

  // Subscriptions
  async getPlans() {
    return this.request('/subscription/plans');
  }

  async getCurrentSubscription() {
    return this.request('/subscription/current');
  }

  async checkAccess(feature) {
    return this.request('/subscription/check', {
      method: 'POST',
      body: JSON.stringify({ feature }),
    });
  }

  async createCheckout(priceId, successUrl, cancelUrl) {
    return this.request('/subscription/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ price_id: priceId, success_url: successUrl, cancel_url: cancelUrl }),
    });
  }

  // Affiliate
  async getAffiliateDashboard() {
    return this.request('/affiliate/dashboard');
  }

  async getAffiliateReferrals() {
    return this.request('/affiliate/referrals');
  }

  async becomeAffiliate() {
    return this.request('/affiliate/become', { method: 'POST' });
  }

  async regenerateReferralCode() {
    return this.request('/affiliate/regenerate', { method: 'POST' });
  }

  // Community
  async getCommunityGroups() {
    return this.request('/community/groups');
  }

  async getCommunityMessages(slug, page = 1, limit = 50) {
    return this.request(`/community/${slug}/messages?page=${page}&limit=${limit}`);
  }

  async sendCommunityMessage(slug, message, replyTo = null) {
    return this.request(`/community/${slug}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, reply_to: replyTo }),
    });
  }

  async likeMessage(messageId) {
    return this.request(`/community/messages/${messageId}/like`, { method: 'POST' });
  }

  async deleteMessage(messageId) {
    return this.request(`/community/messages/${messageId}`, { method: 'DELETE' });
  }

  // Admin
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/users?${query}`);
  }

  async updateUser(userId, data) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAdminSubscriptions(tier = null) {
    const query = tier ? `?tier=${tier}` : '';
    return this.request(`/admin/subscriptions${query}`);
  }

  async getAdminReferrals(status = null) {
    const query = status ? `?status=${status}` : '';
    return this.request(`/admin/referrals${query}`);
  }
}

export const api = new FieldForecastApi();
export default api;