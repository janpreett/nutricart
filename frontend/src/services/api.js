const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token   = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('authToken', token);
    else      localStorage.removeItem('authToken');
  }

  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();
    const config = {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    };
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    const res = await fetch(url, config);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : null;
  }

  // auth
  async register(data) { return this.request('/auth/register', { method: 'POST', body: data }); }
  async login(creds) {
    const t = await this.request('/auth/login', { method: 'POST', body: creds });
    if (t.access_token) this.setToken(t.access_token);
    return t;
  }
  async logout()       { this.setToken(null); }
  async getCurrentUser(){ return this.request('/auth/me'); }

  // profile
  async createProfile(data)    { return this.request('/profile',          { method: 'POST', body: data }); }
  async fetchProfile()         { return this.request('/profile'); }
  async generateMealPlan(id)   { return this.request(`/generate_plan/${id}`); }

  // contact
  async createContact(data)    { return this.request('/contact',          { method: 'POST', body: data }); }

  isAuthenticated() { return !!this.getToken(); }
}

export default new ApiClient();
