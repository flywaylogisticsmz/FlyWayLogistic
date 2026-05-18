/**
 * ═══════════════════════════════════════════
 *  FLY WAY LOGISTIC — APLICAÇÃO PRINCIPAL
 * ═══════════════════════════════════════════
 */

// ─── STATE ───────────────────────────────────
let currentUser = null;
let allOrders = [];
let deleteCallback = null;

// ─── INIT ─────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  const saved = sessionStorage.getItem("flywaylogistic_user");
  if (saved) {
    currentUser = JSON.parse(saved);
    initApp();
  } else {
    showPage("loginPage");
    loadPublicStats();
  }
});

// ─── NAVIGATION ───────────────────────────────
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function showLogin() { showPage("loginPage"); }
function showTrackPublic() { showPage("trackPage"); document.getElementById("trackCode").value = ""; document.getElementById("trackResult").classList.add("hidden"); }

function navigate(el, view) {
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  el.classList.add("active");
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + view).classList.add("active");
  document.getElementById("topbarTitle").textContent = el.querySelector("span").textContent;
  closeSidebarOnMobile();
  // Lazy load
  if (view === "dashboard") loadDashboard();
  if (view === "orders") loadOrders();
  if (view === "users") loadUsers();
  if (view === "reports") loadReports();
  if (view === "settings") loadSettings();
}

function closeSidebarOnMobile() {
  if (window.innerWidth < 900) {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("open");
  }
}

// ─── SIDEBAR ──────────────────────────────────
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebarOverlay").classList.toggle("open");
}

// ─── PUBLIC STATS ─────────────────────────────
async function loadPublicStats() {
  try {
    const data = await API.getPublicStats();
    document.getElementById("statOrders").textContent = data.total ?? "0";
    document.getElementById("statTransit").textContent = data.transit ?? "0";
    document.getElementById("statDelivered").textContent = data.delivered ?? "0";
  } catch {
    // silently fail
  }
}

// ─── LOGIN ────────────────────────────────────
async function doLogin() {
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  const errEl = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  const btnText = document.getElementById("loginBtnText");

  if (!username || !password) {
    showAlert(errEl, "Preencha o utilizador e a palavra-passe.");
    return;
  }

  btn.disabled = true;
  btnText.textContent = "A entrar...";
  errEl.classList.add("hidden");

  try {
    const data = await API.login(username, password);
    currentUser = data.user;
    sessionStorage.setItem("flywaylogistic_user", JSON.stringify(currentUser));
    initApp();
  } catch (e) {
    showAlert(errEl, e.message || "Credenciais inválidas. Tente novamente.");
    btn.disabled = false;
    btnText.textContent = "Entrar";
  }
}

// Enter key on login
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && document.getElementById("loginPage").classList.contains("active")) {
    doLogin();
  }
});

function doLogout() {
  currentUser = null;
  sessionStorage.removeItem("flywaylogistic_user");
  showPage("loginPage");
  loadPublicStats();
}

function togglePw() {
  const inp = document.getElementById("loginPass");
  const icon = document.getElementById("eyeIcon");
  if (inp.type === "password") { inp.type = "text"; icon.className = "fa-solid fa-eye-slash"; }
  else { inp.type = "password"; icon.className = "fa-solid fa-eye"; }
}

// ─── INIT APP ─────────────────────────────────
function initApp() {
  showPage("appPage");
  const isAdmin = currentUser.role === "admin";

  // Sidebar user info
  document.getElementById("sidebarName").textContent = currentUser.name;
  document.getElementById("sidebarRole").textContent = isAdmin ? "Administrador" : "Assistente";
  document.getElementById("sidebarAvatar").textContent = currentUser.name[0].toUpperCase();

  // Admin-only elements
  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = isAdmin ? "" : "none";
  });

  // Load dashboard
  loadDashboard();
}

// ─── DASHBOARD ────────────────────────────────
async function loadDashboard() {
  setKPI("kpiTotal", "—"); setKPI("kpiTransit", "—"); setKPI("kpiDelivered", "—");
  setKPI("kpiPending", "—"); setKPI("kpiCancelled", "—"); setKPI("kpiMonth", "—");

  document.getElementById("recentOrders").innerHTML = spinnerHTML();

  try {
    const data = await API.getDashboard();
    const s = data.stats || {};
    setKPI("kpiTotal", s.total ?? 0);
    setKPI("kpiTransit", s.transit ?? 0);
    setKPI("kpiDelivered", s.delivered ?? 0);
    setKPI("kpiPending", s.pending ?? 0);
    setKPI("kpiCancelled", s.cancelled ?? 0);
    setKPI("kpiMonth", s.month ?? 0);

    renderRecentOrders(data.recent || []);
    renderStatusChart(s);
  } catch (e) {
    document.getElementById("recentOrders").innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Erro ao carregar dados: ${e.message}</div>`;
  }
}

function setKPI(id, val) {
  const el = document.getElementById(id);
  if (el) animateNum(el, val);
}

function animateNum(el, target) {
  if (isNaN(target)) { el.textContent = target; return; }
  const dur = 600, step = 16;
  let cur = 0;
  const inc = target / (dur / step);
  const t = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = Math.floor(cur);
    if (cur >= target) clearInterval(t);
  }, step);
}

function renderRecentOrders(orders) {
  if (!orders.length) {
    document.getElementById("recentOrders").innerHTML = `<div class="empty-state"><i class="fa-solid fa-inbox"></i>Sem encomendas recentes</div>`;
    return;
  }
  document.getElementById("recentOrders").innerHTML = `
    <table>
      <thead><tr>
        <th>Código</th><th>Cliente</th><th>Rota</th><th>Estado</th><th>Data</th>
      </tr></thead>
      <tbody>${orders.slice(0,8).map(o => `
        <tr>
          <td class="td-code">${o.code}</td>
          <td>${o.client}</td>
          <td class="td-muted">${o.country}</td>
          <td>${statusBadge(o.status)}</td>
          <td class="td-muted">${formatDate(o.date)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}

function renderStatusChart(s) {
  const data = [
    { label: "Recebida", val: s.received ?? 0 },
    { label: "Em processamento", val: s.processing ?? 0 },
    { label: "Em trânsito", val: s.transit ?? 0 },
    { label: "Em alfândega", val: s.customs ?? 0 },
    { label: "Saiu p/ entrega", val: s.delivery ?? 0 },
    { label: "Entregue", val: s.delivered ?? 0 },
    { label: "Cancelada", val: s.cancelled ?? 0 },
  ];
  const max = Math.max(...data.map(d => d.val), 1);
  document.getElementById("statusChart").innerHTML = data.map(d => `
    <div class="chart-bar-row">
      <span class="chart-bar-label">${d.label}</span>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${Math.round((d.val/max)*100)}%;background:${CONFIG.STATUS_COLOR[d.label] || CONFIG.STATUS_COLOR["Saiu para entrega"]}"></div>
      </div>
      <span class="chart-bar-val">${d.val}</span>
    </div>`).join("");
}

// ─── ORDERS ───────────────────────────────────
async function loadOrders() {
  document.getElementById("ordersTable").innerHTML = spinnerHTML();
  try {
    const data = await API.getOrders();
    allOrders = data.orders || [];
    renderOrdersTable(allOrders);
  } catch (e) {
    document.getElementById("ordersTable").innerHTML = errorHTML(e.message);
  }
}

function filterOrders() {
  const q = document.getElementById("searchOrders").value.toLowerCase();
  const status = document.getElementById("filterStatus").value;
  const country = document.getElementById("filterCountry").value;

  const filtered = allOrders.filter(o => {
    const matchQ = !q || [o.code, o.client, o.product, o.contact].some(v => (v||"").toLowerCase().includes(q));
    const matchS = !status || o.status === status;
    const matchC = !country || o.country === country;
    return matchQ && matchS && matchC;
  });
  renderOrdersTable(filtered);
}

function renderOrdersTable(orders) {
  if (!orders.length) {
    document.getElementById("ordersTable").innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open"></i>Nenhuma encomenda encontrada</div>`;
    return;
  }
  const isAdmin = currentUser?.role === "admin";
  document.getElementById("ordersTable").innerHTML = `
    <table>
      <thead><tr>
        <th>Código</th><th>Cliente</th><th>Contacto</th><th>Produto</th><th>Rota</th><th>Estado</th><th>Data</th><th>Ações</th>
      </tr></thead>
      <tbody>${orders.map(o => `
        <tr>
          <td class="td-code">${o.code}</td>
          <td>${esc(o.client)}</td>
          <td class="td-muted">${esc(o.contact)}</td>
          <td>${esc(o.product)}</td>
          <td class="td-muted">${esc(o.country)}</td>
          <td>${statusBadge(o.status)}</td>
          <td class="td-muted">${formatDate(o.date)}</td>
          <td>
            <div class="table-actions">
              <button class="btn-icon" title="Atualizar estado" onclick="openStatusModal('${o.id}','${esc(o.status)}')"><i class="fa-solid fa-rotate"></i></button>
              ${isAdmin ? `<button class="btn-icon" title="Editar" onclick="openOrderModal('${o.id}')"><i class="fa-solid fa-pen"></i></button>` : ""}
              ${isAdmin ? `<button class="btn-icon danger" title="Eliminar" onclick="confirmDelete('order','${o.id}')"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}

// ─── ORDER MODAL ──────────────────────────────
function openOrderModal(id = null) {
  const isEdit = !!id;
  document.getElementById("orderModalTitle").textContent = isEdit ? "Editar Encomenda" : "Nova Encomenda";
  document.getElementById("orderEditId").value = id || "";

  if (!isEdit) {
    // Generate code preview
    const now = new Date();
    const datePart = now.toISOString().slice(0,10).replace(/-/g,"");
    const timePart = now.toTimeString().slice(0,5).replace(":","");
    document.getElementById("orderCode").value = `FLY-Encomenda-${datePart}${timePart}`;
    document.getElementById("orderClient").value = "";
    document.getElementById("orderContact").value = "";
    document.getElementById("orderProduct").value = "";
    document.getElementById("orderCountry").value = "";
    document.getElementById("orderStatus").value = "Recebida";
    document.getElementById("orderObs").value = "";
  } else {
    const o = allOrders.find(x => x.id === id);
    if (o) {
      document.getElementById("orderCode").value = o.code;
      document.getElementById("orderClient").value = o.client;
      document.getElementById("orderContact").value = o.contact;
      document.getElementById("orderProduct").value = o.product;
      document.getElementById("orderCountry").value = o.country;
      document.getElementById("orderStatus").value = o.status;
      document.getElementById("orderObs").value = o.obs || "";
    }
  }
  openModal("orderModal");
}

async function saveOrder() {
  const id = document.getElementById("orderEditId").value;
  const order = {
    code: document.getElementById("orderCode").value,
    client: document.getElementById("orderClient").value.trim(),
    contact: document.getElementById("orderContact").value.trim(),
    product: document.getElementById("orderProduct").value.trim(),
    country: document.getElementById("orderCountry").value,
    status: document.getElementById("orderStatus").value,
    obs: document.getElementById("orderObs").value.trim(),
  };

  if (!order.client || !order.product || !order.country) {
    showToast("Preencha todos os campos obrigatórios.", "error");
    return;
  }

  const btn = document.getElementById("saveOrderBtn");
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> A guardar...`;

  try {
    if (id) {
      await API.updateOrder(id, order);
      showToast("Encomenda atualizada com sucesso!", "success");
    } else {
      await API.createOrder(order);
      showToast("Encomenda criada com sucesso!", "success");
    }
    closeModal("orderModal");
    loadOrders();
    loadDashboard();
  } catch (e) {
    showToast("Erro: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-save"></i> Guardar`;
  }
}

// ─── STATUS UPDATE ────────────────────────────
function openStatusModal(id, currentStatus) {
  document.getElementById("statusEditId").value = id;
  document.getElementById("statusNewVal").value = currentStatus;
  document.getElementById("statusObs").value = "";
  openModal("statusModal");
}

async function confirmStatusUpdate() {
  const id = document.getElementById("statusEditId").value;
  const status = document.getElementById("statusNewVal").value;
  const obs = document.getElementById("statusObs").value;
  try {
    await API.updateStatus(id, status, obs);
    showToast("Estado atualizado!", "success");
    closeModal("statusModal");
    loadOrders();
    loadDashboard();
  } catch (e) {
    showToast("Erro: " + e.message, "error");
  }
}

// ─── DELETE ───────────────────────────────────
function confirmDelete(type, id) {
  const msgs = { order: "Tem a certeza que deseja eliminar esta encomenda?", user: "Tem a certeza que deseja eliminar este utilizador?" };
  document.getElementById("deleteMsg").textContent = msgs[type] || "Confirma a eliminação?";
  deleteCallback = async () => {
    try {
      if (type === "order") await API.deleteOrder(id);
      if (type === "user") await API.deleteUser(id);
      showToast("Eliminado com sucesso.", "success");
      closeModal("deleteModal");
      if (type === "order") { loadOrders(); loadDashboard(); }
      if (type === "user") loadUsers();
    } catch (e) {
      showToast("Erro: " + e.message, "error");
    }
  };
  document.getElementById("confirmDeleteBtn").onclick = deleteCallback;
  openModal("deleteModal");
}

// ─── TRACKING (PUBLIC) ────────────────────────
async function publicTrack() {
  const code = document.getElementById("trackCode").value.trim();
  if (!code) { showToast("Insira o código da encomenda.", "error"); return; }
  const res = document.getElementById("trackResult");
  res.innerHTML = spinnerHTML();
  res.classList.remove("hidden");
  try {
    const data = await API.getOrder(code);
    res.innerHTML = renderTrackResult(data.order);
  } catch (e) {
    res.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-question"></i>Encomenda não encontrada.<br><small>Verifique o código e tente novamente.</small></div>`;
  }
}

async function internalTrack() {
  const code = document.getElementById("trackIntCode").value.trim();
  if (!code) { showToast("Insira o código da encomenda.", "error"); return; }
  const res = document.getElementById("trackIntResult");
  res.innerHTML = spinnerHTML();
  try {
    const data = await API.getOrder(code);
    res.innerHTML = renderTrackResult(data.order);
  } catch (e) {
    res.innerHTML = `<div class="empty-state"><i class="fa-solid fa-circle-question"></i>Encomenda não encontrada.</div>`;
  }
}

function renderTrackResult(o) {
  if (!o) return `<div class="empty-state"><i class="fa-solid fa-circle-question"></i>Encomenda não encontrada.</div>`;

  const statusOrder = CONFIG.STATUSES;
  const currentIdx = statusOrder.indexOf(o.status);
  const isCancelled = o.status === "Cancelada";

  const timelineSteps = isCancelled
    ? [{ label: "Cancelada", date: o.updatedDate || o.date, obs: o.obs }]
    : statusOrder.filter(s => s !== "Cancelada").map((s, i) => ({
        label: s,
        date: i <= currentIdx ? (i === currentIdx ? (o.updatedDate || o.date) : "") : "",
        done: i < currentIdx,
        active: i === currentIdx,
        obs: i === currentIdx ? (o.obs || "") : ""
      }));

  return `
    <div class="track-result-card">
      <div class="track-order-header">
        <div>
          <div class="track-code">${o.code}</div>
          <div class="track-name">${esc(o.client)}</div>
          <div class="track-meta">${esc(o.product)} · ${esc(o.country)}</div>
          <div class="track-meta" style="margin-top:4px">Contacto: ${esc(o.contact)}</div>
        </div>
        <div>${statusBadge(o.status)}</div>
      </div>
      <div class="timeline">
        ${timelineSteps.map(step => {
          const cls = step.active ? "active" : (step.done ? "done" : (isCancelled ? "cancelled" : ""));
          return `
            <div class="tl-step ${cls}">
              <div class="tl-dot"></div>
              <div class="tl-label"><i class="fa-solid ${CONFIG.STATUS_ICON[step.label] || 'fa-circle'}" style="margin-right:6px;font-size:12px"></i>${step.label}</div>
              ${step.date ? `<div class="tl-date">${formatDate(step.date)}</div>` : ""}
              ${step.obs ? `<div class="tl-obs">${esc(step.obs)}</div>` : ""}
            </div>`;
        }).join("")}
      </div>
    </div>`;
}

// ─── USERS ────────────────────────────────────
let allUsers = [];

async function loadUsers() {
  document.getElementById("usersTable").innerHTML = spinnerHTML();
  try {
    const data = await API.getUsers();
    allUsers = data.users || [];
    renderUsersTable(allUsers);
  } catch (e) {
    document.getElementById("usersTable").innerHTML = errorHTML(e.message);
  }
}

function renderUsersTable(users) {
  if (!users.length) {
    document.getElementById("usersTable").innerHTML = `<div class="empty-state"><i class="fa-solid fa-users"></i>Sem utilizadores registados</div>`;
    return;
  }
  document.getElementById("usersTable").innerHTML = `
    <table>
      <thead><tr><th>Nome</th><th>Username</th><th>Papel</th><th>Criado em</th><th>Ações</th></tr></thead>
      <tbody>${users.map(u => `
        <tr>
          <td>${esc(u.name)}</td>
          <td class="td-code">${esc(u.username)}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-delivery' : 'badge-received'}">${u.role === 'admin' ? 'Administrador' : 'Assistente'}</span></td>
          <td class="td-muted">${formatDate(u.created)}</td>
          <td>
            <div class="table-actions">
              <button class="btn-icon" onclick="openUserModal('${u.id}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn-icon danger" onclick="confirmDelete('user','${u.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`).join("")}
      </tbody>
    </table>`;
}

function openUserModal(id = null) {
  document.getElementById("userModalTitle").textContent = id ? "Editar Utilizador" : "Novo Utilizador";
  document.getElementById("userEditId").value = id || "";
  if (!id) {
    document.getElementById("userName").value = "";
    document.getElementById("userUsername").value = "";
    document.getElementById("userPass").value = "";
    document.getElementById("userRole").value = "assistente";
  } else {
    const u = allUsers.find(x => x.id === id);
    if (u) {
      document.getElementById("userName").value = u.name;
      document.getElementById("userUsername").value = u.username;
      document.getElementById("userPass").value = "";
      document.getElementById("userRole").value = u.role;
    }
  }
  openModal("userModal");
}

async function saveUser() {
  const id = document.getElementById("userEditId").value;
  const user = {
    name: document.getElementById("userName").value.trim(),
    username: document.getElementById("userUsername").value.trim(),
    password: document.getElementById("userPass").value,
    role: document.getElementById("userRole").value,
  };
  if (!user.name || !user.username || (!id && !user.password)) {
    showToast("Preencha todos os campos obrigatórios.", "error");
    return;
  }
  try {
    if (id) await API.updateUser(id, user);
    else await API.createUser(user);
    showToast(id ? "Utilizador atualizado!" : "Utilizador criado!", "success");
    closeModal("userModal");
    loadUsers();
  } catch (e) {
    showToast("Erro: " + e.message, "error");
  }
}

// ─── REPORTS ──────────────────────────────────
async function loadReports() {
  document.getElementById("reportByStatus").innerHTML = spinnerHTML();
  document.getElementById("reportByRoute").innerHTML = spinnerHTML();
  document.getElementById("reportByMonth").innerHTML = spinnerHTML();

  try {
    const data = await API.getDashboard();
    const s = data.stats || {};
    const orders = data.orders || [];

    // By status
    const statuses = CONFIG.STATUSES;
    const statusCounts = {};
    statuses.forEach(st => statusCounts[st] = 0);
    (data.allOrders || []).forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });

    document.getElementById("reportByStatus").innerHTML = `
      <table class="report-table">
        <thead><tr><th>Estado</th><th>Qtd</th><th>%</th></tr></thead>
        <tbody>${statuses.map(st => {
          const pct = s.total ? Math.round((statusCounts[st]/s.total)*100) : 0;
          return `<tr><td>${statusBadge(st)}</td><td>${statusCounts[st]}</td><td>${pct}%</td></tr>`;
        }).join("")}</tbody>
      </table>`;

    // By route
    const routes = CONFIG.ROUTES;
    const routeCounts = {};
    routes.forEach(r => routeCounts[r] = 0);
    (data.allOrders || []).forEach(o => { if (routeCounts[o.country] !== undefined) routeCounts[o.country]++; });

    document.getElementById("reportByRoute").innerHTML = `
      <table class="report-table">
        <thead><tr><th>Rota</th><th>Encomendas</th></tr></thead>
        <tbody>${routes.map(r => `<tr><td>${r}</td><td>${routeCounts[r]}</td></tr>`).join("")}</tbody>
      </table>`;

    // By month
    const byMonth = {};
    (data.allOrders || []).forEach(o => {
      const m = (o.date || "").slice(0, 7);
      if (m) byMonth[m] = (byMonth[m] || 0) + 1;
    });
    const monthKeys = Object.keys(byMonth).sort().reverse().slice(0, 12);
    document.getElementById("reportByMonth").innerHTML = monthKeys.length ? `
      <table class="report-table">
        <thead><tr><th>Mês</th><th>Encomendas</th></tr></thead>
        <tbody>${monthKeys.map(m => `<tr><td>${m}</td><td>${byMonth[m]}</td></tr>`).join("")}</tbody>
      </table>` : `<div class="empty-state">Sem dados suficientes</div>`;

  } catch (e) {
    [document.getElementById("reportByStatus"), document.getElementById("reportByRoute"), document.getElementById("reportByMonth")]
      .forEach(el => el.innerHTML = errorHTML(e.message));
  }
}

function exportCSV() {
  if (!allOrders.length) { showToast("Sem dados para exportar.", "error"); return; }
  const headers = ["Código","Cliente","Contacto","Produto","Rota","Estado","Data","Observação"];
  const rows = allOrders.map(o => [o.code, o.client, o.contact, o.product, o.country, o.status, o.date, o.obs || ""].map(v => `"${(v||"").replace(/"/g,'""')}"`));
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `flywaylogistic_encomendas_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast("CSV exportado com sucesso!", "success");
}

// ─── SETTINGS ─────────────────────────────────
async function loadSettings() {
  try {
    const data = await API.getSettings();
    const s = data.settings || {};
    document.getElementById("pricePTMZ").value = s.pricePTMZ || "";
    document.getElementById("priceMZPT").value = s.priceMZPT || "";
    document.getElementById("taxCustoms").value = s.taxCustoms || "";
    document.getElementById("avgDays").value = s.avgDays || "";
  } catch { /* silent */ }
}

async function saveSettings() {
  const settings = {
    pricePTMZ: document.getElementById("pricePTMZ").value,
    priceMZPT: document.getElementById("priceMZPT").value,
    taxCustoms: document.getElementById("taxCustoms").value,
    avgDays: document.getElementById("avgDays").value,
  };
  try {
    await API.saveSettings(settings);
    showToast("Configurações guardadas!", "success");
  } catch (e) {
    showToast("Erro: " + e.message, "error");
  }
}

// ─── MODAL HELPERS ────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove("hidden"); document.body.style.overflow = "hidden"; }
function closeModal(id) { document.getElementById(id).classList.add("hidden"); document.body.style.overflow = ""; }
function closeModalOut(e, id) { if (e.target === e.currentTarget) closeModal(id); }

// ─── UI HELPERS ───────────────────────────────
function statusBadge(status) {
  const cls = CONFIG.STATUS_CLASS[status] || "badge-received";
  const icon = CONFIG.STATUS_ICON[status] || "fa-circle";
  return `<span class="badge ${cls}"><i class="fa-solid ${icon}"></i>${status}</span>`;
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function esc(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function spinnerHTML() {
  return `<div class="spinner-wrap"><div class="spinner"></div></div>`;
}

function errorHTML(msg) {
  return `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Erro: ${esc(msg || "Falha na ligação")}</div>`;
}

function showAlert(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

let toastTimer;
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
  t.innerHTML = `<i class="fa-solid ${icon}" style="color:${type === 'success' ? 'var(--green)' : 'var(--red)'}"></i>${msg}`;
  t.className = `toast toast-${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 3500);
}
