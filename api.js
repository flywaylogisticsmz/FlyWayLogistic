/**
 * ═══════════════════════════════════════════
 *  FLY WAY LOGISTIC — CAMADA DE API
 *  Comunicação com Google Apps Script
 * ═══════════════════════════════════════════
 */

const API = (() => {

  async function call(action, params = {}) {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  async function post(action, body = {}) {
    const res = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  return {
    // AUTH
    login: (username, password) => post("login", { username, password }),
    getPublicStats: () => call("getPublicStats"),

    // ORDERS
    getOrders: () => call("getOrders"),
    getOrder: (code) => call("getOrder", { code }),
    createOrder: (order) => post("createOrder", { order }),
    updateOrder: (id, order) => post("updateOrder", { id, order }),
    deleteOrder: (id) => post("deleteOrder", { id }),
    updateStatus: (id, status, obs) => post("updateStatus", { id, status, obs }),

    // DASHBOARD
    getDashboard: () => call("getDashboard"),

    // USERS (admin only)
    getUsers: () => call("getUsers"),
    createUser: (user) => post("createUser", { user }),
    updateUser: (id, user) => post("updateUser", { id, user }),
    deleteUser: (id) => post("deleteUser", { id }),

    // SETTINGS (admin only)
    getSettings: () => call("getSettings"),
    saveSettings: (settings) => post("saveSettings", { settings }),
  };
})();
