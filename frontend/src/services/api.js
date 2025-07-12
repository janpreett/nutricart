/* ---------------------------------------------------------------
 *  src/services/api.js
 *  Centralised wrapper around the FastAPI backend.
 * ------------------------------------------------------------- */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    /* when we reload Vite the constructor runs again, so pull the
       stored token (if any) right away                               */
    this.token = localStorage.getItem('authToken') || null;
  }

  /* ------------------------------------------------------------
   * token helpers
   * ---------------------------------------------------------- */
  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('authToken', token);
    else        localStorage.removeItem('authToken');
  }

  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  /* ------------------------------------------------------------
   * generic request helper (fetch-wrapper)
   * ---------------------------------------------------------- */
  async request(endpoint, options = {}) {
    const url   = `${this.baseURL}${endpoint}`;
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
      /* Backend always sends a JSON body with `{detail: ...}` on errors */
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : null;
  }

  /* -----------------------  Auth  --------------------------- */
  async register(data)   { return this.request('/auth/register', { method: 'POST', body: data }); }
  async login(creds) {
    const t = await this.request('/auth/login', { method: 'POST', body: creds });
    if (t.access_token) this.setToken(t.access_token);
    return t;
  }
  async logout()         { this.setToken(null); }
  async getCurrentUser() { return this.request('/auth/me'); }

  /* ---------------------  Profile  -------------------------- */
  /** First try POST /profile.  
   *  If it already exists the backend returns `400 Profile already exists`,
   *  so we retry with PUT /profile to update the record in-place.        */
  async createOrUpdateProfile(data) {
    try {
      return await this.request('/profile', { method: 'POST', body: data });
    } catch (err) {
      if (err.message === 'Profile already exists') {
        return this.request('/profile', { method: 'PUT', body: data });
      }
      throw err;
    }
  }

  async fetchProfile()      { return this.request('/profile'); }
  async generateMealPlan(id){ return this.request(`/generate_plan/${id}`); }

  /* ---------------------  Contact  -------------------------- */
  async createContact(data) { return this.request('/contact', { method: 'POST', body: data }); }
}

/* Export ONE singleton instance – no named exports */
export default new ApiClient();
