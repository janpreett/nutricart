/* ---------------------------------------------------------------
 *  src/services/api.js  –  singular wrapper around the FastAPI backend
 * ------------------------------------------------------------- */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor () {
    this.baseURL = API_BASE_URL;
    this.token   = localStorage.getItem('authToken') || null;
  }

  /* token helpers */
  setToken (t) {
    this.token = t;
    t ? localStorage.setItem('authToken', t)
      : localStorage.removeItem('authToken');
  }
  getToken ()        { return this.token || localStorage.getItem('authToken'); }
  isAuthenticated () { return !!this.getToken(); }

  /* fetch wrapper */
  async request (endpoint, opts = {}) {
    const cfg = {
      headers : { 'Content-Type': 'application/json', ...opts.headers },
      ...opts,
    };
    if (this.getToken()) cfg.headers.Authorization = `Bearer ${this.getToken()}`;
    if (cfg.body && typeof cfg.body === 'object') cfg.body = JSON.stringify(cfg.body);

    const res = await fetch(`${this.baseURL}${endpoint}`, cfg);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.headers.get('content-type')?.includes('application/json')
      ? res.json() : null;
  }

  /* auth */
  register      (d) { return this.request('/auth/register', { method:'POST', body:d }); }
  async login   (c) {
    const t = await this.request('/auth/login', { method:'POST', body:c });
    if (t.access_token) this.setToken(t.access_token);
    return t;
  }
  logout        ()  { this.setToken(null); }
  getCurrentUser()  { return this.request('/auth/me'); }

  /* profile (single POST covers create + update) */
  createOrUpdateProfile (d) { return this.request('/profile', { method:'POST', body:d }); }
  fetchProfile          () { return this.request('/profile'); }

  /* meal-plan & swapping */
  generateMealPlan (id)            { return this.request(`/generate_plan/${id}`); }
  swapMeal (userId, dayIdx, mealIdx){
    return this.request(`/swap_meal/${userId}`, {
      method:'POST',
      body:{ day_index:dayIdx, meal_index:mealIdx }
    });
  }

  /* contact */
  createContact (d) { return this.request('/contact', { method:'POST', body:d }); }
}

export default new ApiClient();
