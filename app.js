// ════════════════════════════════════════════════════
// Fly Way Logistics — app.js  (versão corrigida)
// ════════════════════════════════════════════════════

// ── CONSTANTES ──────────────────────────────────────
const STEPS = [
  { key: 'Em processamento',  icon: '📋', lbl: 'Em processamento' },
  { key: 'Recolhido',         icon: '🚚', lbl: 'Recolhido'        },
  { key: 'Em trânsito',       icon: '✈️', lbl: 'Em trânsito'      },
  { key: 'Em alfândega',      icon: '🛃', lbl: 'Em alfândega'     },
  { key: 'Chegou ao destino', icon: '📍', lbl: 'Chegado'          },
  { key: 'Saiu para entrega', icon: '🛵', lbl: 'Para entrega'     },
  { key: 'Entregue',          icon: '✅', lbl: 'Entregue'         }
];

const SCSS = {
  'Em processamento' : 'sp-proc',
  'Recolhido'        : 'sp-coll',
  'Em trânsito'      : 'sp-tran',
  'Em alfândega'     : 'sp-cust',
  'Chegou ao destino': 'sp-arrv',
  'Saiu para entrega': 'sp-deli',
  'Entregue'         : 'sp-done'
};

let editId = null, deleteId = null, waPhone = '', waMsg = '';

// ════════════════════════════════════════════════════
// GOOGLE SHEETS — URL
// Prioridade:
//   1) config.js → sheets.urlFixo  ← PRINCIPAL (funciona em todos os devices)
//   2) localStorage (admin guardou via painel)
//   3) parâmetro ?gs= na URL
//   4) vazio → modo local/demo
// ════════════════════════════════════════════════════
function getGsUrl() {
  // 1. config.js (fixo no código — funciona em TODOS os dispositivos)
  const fromConfig = (window.FLY_CONFIG && window.FLY_CONFIG.sheets && window.FLY_CONFIG.sheets.urlFixo) || '';
  if (fromConfig && fromConfig.indexOf('http') === 0) return fromConfig;

  // 2. localStorage (admin configurou manualmente no painel)
  const fromStorage = localStorage.getItem('fw_gs_url') || '';
  if (fromStorage && fromStorage.indexOf('http') === 0) return fromStorage;

  // 3. Parâmetro na URL (?gs=...)
  try {
    const params  = new URLSearchParams(window.location.search);
    const fromUrl = params.get('gs') || '';
    if (fromUrl && fromUrl.indexOf('http') === 0) return fromUrl;
  } catch(e) {}

  return '';
}

function setGsUrl(url)  { localStorage.setItem('fw_gs_url', url); }
function clearGsUrl()   { localStorage.removeItem('fw_gs_url'); }
function useSheets()    { return getGsUrl() !== ''; }

function buildShareLink() {
  const base = window.location.href.split('?')[0].split('#')[0];
  return base; // URL limpo — o Sheets está no config.js, não precisa de parâmetro
}

// ── CONFIGURAÇÕES ────────────────────────────────────
const S = {
  get: function(k, d) { return localStorage.getItem('fw_' + k) || (d !== undefined ? d : ''); },
  set: function(k, v) { localStorage.setItem('fw_' + k, v); }
};
function getPass() {
  // Prioridade: localStorage → config.js → padrão
  const stored = S.get('pass', '');
  if (stored) return stored;
  const fromConfig = (window.FLY_CONFIG && window.FLY_CONFIG.auth && window.FLY_CONFIG.auth.senhaDefault) || '';
  return fromConfig || 'flyadmin123';
}

// ════════════════════════════════════════════════════
// DADOS LOCAIS (demo / fallback)
// ════════════════════════════════════════════════════
function localOrders() {
  try {
    const r = localStorage.getItem('fw_orders');
    return r ? JSON.parse(r) : [];
  } catch(e) { return []; }
}
function saveLocal(o) {
  try { localStorage.setItem('fw_orders', JSON.stringify(o)); } catch(e) {}
}

// ════════════════════════════════════════════════════
// API GOOGLE SHEETS — fetch com timeout e retry
// ════════════════════════════════════════════════════
function buildQs(params) {
  return Object.keys(params).map(function(k) {
    var v = (typeof params[k] === 'object')
      ? encodeURIComponent(JSON.stringify(params[k]))
      : encodeURIComponent(String(params[k]));
    return k + '=' + v;
  }).join('&');
}

async function fetchWithTimeout(url, options, timeoutMs) {
  timeoutMs = timeoutMs || 15000;
  const controller = new AbortController();
  const timer = setTimeout(function() { controller.abort(); }, timeoutMs);
  try {
    const res = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
    clearTimeout(timer);
    return res;
  } catch(e) {
    clearTimeout(timer);
    throw e;
  }
}

async function sheetsCall(params) {
  const url = getGsUrl();
  if (!url) throw new Error('URL do Google Sheets não configurado');

  const qs      = buildQs(params);
  const fullUrl = url + '?' + qs;

  // Tentativa 1: fetch normal com follow-redirect
  try {
    const res  = await fetchWithTimeout(fullUrl, { method: 'GET', redirect: 'follow' }, 15000);
    const text = await res.text();
    // Limpar possível BOM ou whitespace
    const clean = text.trim().replace(/^\uFEFF/, '');
    const data  = JSON.parse(clean);
    if (data.ok === false) throw new Error(data.error || 'Erro no servidor Apps Script');
    return data;
  } catch(e) {
    // Se for erro de parse JSON, mostrar o texto recebido para diagnóstico
    if (e instanceof SyntaxError) {
      throw new Error('Resposta inválida do servidor. Verifique se o Apps Script está publicado correctamente como Web App com acesso "Qualquer pessoa".');
    }
    throw e;
  }
}

async function getOrders() {
  if (!useSheets()) return localOrders();
  try {
    const r = await sheetsCall({ action: 'getAll' });
    return r.orders || [];
  } catch(e) {
    console.error('getOrders falhou:', e.message);
    throw e; // propaga o erro — NÃO fazer fallback silencioso para dados locais
  }
}

async function persistOrder(order, isNew) {
  // Guarda localmente primeiro (cache)
  const local = localOrders();
  if (isNew) {
    local.unshift(order);
  } else {
    const i = local.findIndex(function(o) { return o.id === order.id; });
    if (i >= 0) local[i] = order;
    else local.unshift(order);
  }
  saveLocal(local);

  // Envia para o Sheets
  if (!useSheets()) return;
  await sheetsCall({ action: isNew ? 'create' : 'update', data: order });
}

async function removeOrder(id) {
  saveLocal(localOrders().filter(function(o) { return o.id !== id; }));
  if (!useSheets()) return;
  await sheetsCall({ action: 'delete', id: id });
}

// ════════════════════════════════════════════════════
// SESSÃO (expira após 2 horas)
// ════════════════════════════════════════════════════
const SESSION_TTL = 2 * 60 * 60 * 1000;

function isSessionValid() {
  try {
    const raw = sessionStorage.getItem('fw_auth');
    if (!raw) return false;
    const obj = JSON.parse(raw);
    if (obj.token !== 'ok' || Date.now() > obj.expires) {
      sessionStorage.removeItem('fw_auth');
      return false;
    }
    return true;
  } catch(e) {
    sessionStorage.removeItem('fw_auth');
    return false;
  }
}

function createSession() {
  sessionStorage.setItem('fw_auth', JSON.stringify({
    token:   'ok',
    expires: Date.now() + SESSION_TTL
  }));
}

// ════════════════════════════════════════════════════
// VISTAS
// ════════════════════════════════════════════════════
function showView(name) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  const el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  const ti = document.getElementById('track-input');
  if (ti) ti.value = '';
  updateHomeUI();
  showView('home');
}

function openAdmin() {
  if (isSessionValid()) { showView('admin'); initAdmin(); }
  else showView('login');
}

// ════════════════════════════════════════════════════
// UI PÁGINA INICIAL
// ════════════════════════════════════════════════════
async function updateHomeUI() {
  const alertEl  = document.getElementById('no-sheets-alert');
  const examples = document.getElementById('hero-hint-examples');

  if (!useSheets()) {
    if (alertEl)  alertEl.style.display  = 'flex';
    if (examples) examples.style.display = 'none';
    ['s-total','s-transit','s-done'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    return;
  }

  if (alertEl)  alertEl.style.display  = 'none';
  if (examples) examples.style.display = 'block';

  try {
    const orders = await getOrders();
    const sTotal   = document.getElementById('s-total');
    const sTransit = document.getElementById('s-transit');
    const sDone    = document.getElementById('s-done');
    if (sTotal)   sTotal.textContent   = orders.length;
    if (sTransit) sTransit.textContent = orders.filter(function(o) {
      return ['Em trânsito','Em alfândega','Saiu para entrega'].indexOf(o.status) >= 0;
    }).length;
    if (sDone)    sDone.textContent    = orders.filter(function(o) { return o.status === 'Entregue'; }).length;
  } catch(e) {
    console.warn('Stats não carregadas:', e.message);
  }
}

function updateNavBadge() { /* removido da navbar */ }

// ════════════════════════════════════════════════════
// RASTREAMENTO
// ════════════════════════════════════════════════════
async function doTrack() {
  const input = document.getElementById('track-input');
  const val   = input ? input.value.trim().toUpperCase() : '';
  if (!val) { toast('Introduza um código de rastreamento', 'err'); return; }

  if (!useSheets()) {
    toast('Sistema ainda não tem base de dados configurada. Contacte o administrador.', 'err');
    return;
  }

  showView('loading');
  try {
    const orders = await getOrders();
    const o      = orders.find(function(x) { return x.id === val; });
    const rc     = document.getElementById('result-content');
    if (rc) rc.innerHTML = o ? buildResult(o) : buildNotFound(val);
    showView('result');
  } catch(e) {
    toast('Erro ao pesquisar: ' + e.message, 'err');
    showView('home');
  }
}

function buildNotFound(id) {
  return '<div class="not-found">'
    + '<div class="nf-icon">🔍</div>'
    + '<div class="nf-h">Encomenda não encontrada</div>'
    + '<p class="nf-p">O código <strong>' + id + '</strong> não existe no sistema.<br>Verifique o código e tente novamente.</p>'
    + '<button class="btn-prim" style="margin-top:24px" onclick="goHome()">Tentar novamente</button>'
    + '</div>';
}

function buildResult(o) {
  const si        = STEPS.findIndex(function(s) { return s.key === o.status; });
  const stepsHTML = STEPS.map(function(s, i) {
    const c = i < si ? 'done' : i === si ? 'active' : 'pending';
    return '<div class="step-it ' + c + '">'
      + '<div class="step-dot ' + c + '">' + s.icon + '</div>'
      + '<div class="step-lbl ' + c + '">' + s.lbl + '</div>'
      + '</div>';
  }).join('');

  const hist = Array.isArray(o.history) ? o.history : [];
  const histHTML = hist.slice().reverse().map(function(h, i) {
    const si2 = STEPS.findIndex(function(s) { return s.key === h.status; });
    const ic  = si2 >= 0 ? STEPS[si2].icon : '📦';
    return '<div class="tl-it">'
      + '<div class="tl-dot ' + (i === 0 ? 'cur' : 'old') + '">' + ic + '</div>'
      + '<div class="tl-body">'
      + '<div class="tl-stat ' + (i === 0 ? 'cur' : '') + '">' + h.status + '</div>'
      + '<div class="tl-date">' + h.date + '</div>'
      + (h.note ? '<div class="tl-note">' + h.note + '</div>' : '')
      + '</div></div>';
  }).join('');

  const badge = SCSS[o.status] || 'sp-proc';
  return '<div class="order-card">'
    + '<div class="order-top">'
    + '<div class="order-icon-wrap">'
    + '<div class="order-ico"><svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>'
    + '<div><div class="order-id-txt">' + o.id + '</div><div class="order-cust">' + o.name + '</div></div>'
    + '</div>'
    + '<span class="status-pill ' + badge + '">' + o.status + '</span>'
    + '</div>'
    + '<div class="route-vis">'
    + '<div class="route-pt"><div class="route-flag">🇵🇹</div><div class="route-name">Portugal</div><div class="route-city">' + (o.origin||'') + '</div></div>'
    + '<div class="route-mid"><div class="route-ln"><div class="route-ln-plane"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></div></div><div class="route-eta">Rota aérea direta</div></div>'
    + '<div class="route-pt"><div class="route-flag">🇲🇿</div><div class="route-name">Moçambique</div><div class="route-city">' + (o.dest||'') + '</div></div>'
    + '</div>'
    + '<div class="order-meta">'
    + '<div class="meta-item"><label>Produto</label><span>' + (o.product||'—') + '</span></div>'
    + '<div class="meta-item"><label>Peso</label><span>' + (o.weight||'—') + ' kg</span></div>'
    + '<div class="meta-item"><label>Última atualização</label><span>' + (o.updatedAt||'—') + '</span></div>'
    + '<div class="meta-item"><label>Contacto</label><span>' + (o.phone||'—') + '</span></div>'
    + '</div></div>'
    + '<div class="timeline-card" style="margin-top:0">'
    + '<div class="sec-title">Progresso da entrega</div>'
    + '<div class="steps-bar">' + stepsHTML + '</div>'
    + '<div class="sec-title">Histórico completo</div>'
    + '<div class="tl-list">' + histHTML + '</div>'
    + '</div>';
}

// ════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ════════════════════════════════════════════════════
function doLogin() {
  const input = document.getElementById('admin-pass');
  const err   = document.getElementById('login-err');
  if (!input) return;
  if (input.value === getPass()) {
    createSession();
    if (err) err.classList.add('hidden');
    input.value = '';
    showView('admin');
    initAdmin();
  } else {
    if (err) err.classList.remove('hidden');
    input.value = '';
    input.focus();
  }
}

function doLogout() {
  sessionStorage.removeItem('fw_auth');
  showView('home');
}

// ════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════
async function initAdmin() {
  if (!isSessionValid()) { showView('login'); return; }
  genId();
  loadSettingsUI();
  const btnSync = document.getElementById('btn-sync');
  if (btnSync) btnSync.classList.toggle('hidden', !useSheets());
  await renderCounters();
  await renderTable();
}

async function syncSheets() {
  toast('A sincronizar...', 'ok');
  try {
    await initAdmin();
    toast('Sincronizado!', 'ok');
  } catch(e) {
    toast('Erro ao sincronizar: ' + e.message, 'err');
  }
}

async function renderCounters() {
  let orders = [];
  try { orders = await getOrders(); } catch(e) { orders = localOrders(); }
  let pr = 0, tr = 0, dn = 0;
  orders.forEach(function(x) {
    if (['Em processamento','Recolhido'].indexOf(x.status) >= 0) pr++;
    else if (['Em trânsito','Em alfândega','Chegou ao destino','Saiu para entrega'].indexOf(x.status) >= 0) tr++;
    else if (x.status === 'Entregue') dn++;
  });
  const el = document.getElementById('counters');
  if (el) el.innerHTML =
    '<div class="cnt-card"><div class="cnt-n">' + orders.length + '</div><div class="cnt-l">Total</div></div>'
    + '<div class="cnt-card"><div class="cnt-n" style="color:var(--warn)">' + pr + '</div><div class="cnt-l">Em Processamento</div></div>'
    + '<div class="cnt-card"><div class="cnt-n" style="color:#5B21B6">' + tr + '</div><div class="cnt-l">Em Trânsito</div></div>'
    + '<div class="cnt-card"><div class="cnt-n" style="color:var(--ok)">' + dn + '</div><div class="cnt-l">Entregues</div></div>';
}

async function renderTable() {
  const srch = document.getElementById('srch-inp');
  const q    = srch ? srch.value.toLowerCase() : '';
  let orders = [];
  try { orders = await getOrders(); } catch(e) { orders = localOrders(); }
  if (q) orders = orders.filter(function(x) {
    return (x.id||'').toLowerCase().indexOf(q) >= 0
        || (x.name||'').toLowerCase().indexOf(q) >= 0
        || (x.product||'').toLowerCase().indexOf(q) >= 0;
  });
  const cnt = document.getElementById('tbl-count');
  if (cnt) cnt.textContent = orders.length + ' encomenda(s)';
  const b = document.getElementById('tbl-body');
  if (!b) return;
  if (!orders.length) {
    b.innerHTML = '<tr><td colspan="7"><div class="empty-tbl">Nenhuma encomenda encontrada</div></td></tr>';
    return;
  }
  b.innerHTML = orders.map(function(x) {
    const bg = SCSS[x.status] || 'sp-proc';
    const pr = (x.product||'').length > 30 ? x.product.slice(0,30)+'…' : (x.product||'');
    return '<tr>'
      + '<td><span class="tbl-id">' + x.id + '</span></td>'
      + '<td style="font-weight:600">' + x.name + '</td>'
      + '<td title="' + (x.product||'') + '">' + pr + '</td>'
      + '<td style="color:var(--g5)">' + (x.dest||'') + '</td>'
      + '<td><span class="status-pill ' + bg + '" style="font-size:10px;padding:5px 10px">' + x.status + '</span></td>'
      + '<td style="color:var(--g5);font-size:12px">' + (x.updatedAt||'') + '</td>'
      + '<td><div class="tbl-acts">'
      + '<button class="btn-sm btn-edit" onclick="editOrder(\'' + x.id + '\')">Editar</button>'
      + '<button class="btn-sm btn-del"  onclick="promptDel(\'' + x.id + '\')">Eliminar</button>'
      + '</div></td></tr>';
  }).join('');
}

function switchTab(btn) {
  const panel = btn.dataset.panel;
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  ['list','new','edit','settings'].forEach(function(p) {
    const el = document.getElementById('panel-' + p);
    if (el) el.classList.toggle('hidden', p !== panel);
  });
  if (panel === 'list')     renderTable();
  if (panel === 'new')      genId();
  if (panel === 'settings') loadSettingsUI();
}

function switchTabByName(name) {
  const btn = document.querySelector('.tab[data-panel="' + name + '"]');
  if (btn) switchTab(btn);
}

// ── GERAR ID ──────────────────────────────────────────
function genId() {
  const o    = localOrders();
  const nums = o.map(function(x) { return parseInt((x.id||'').replace('FLY','')) || 0; });
  const next = (Math.max.apply(null, [0].concat(nums)) + 1).toString().padStart(5,'0');
  const el   = document.getElementById('n-id');
  if (el) el.value = 'FLY' + next;
}

// ── CRIAR ─────────────────────────────────────────────
async function createOrder() {
  const name    = (document.getElementById('n-name')||{}).value  ? document.getElementById('n-name').value.trim() : '';
  const product = (document.getElementById('n-product')||{}).value ? document.getElementById('n-product').value.trim() : '';
  if (!name || !product) { toast('Nome e produto são obrigatórios', 'err'); return; }
  const status = document.getElementById('n-status').value;
  const order  = {
    id       : document.getElementById('n-id').value,
    name     : name,
    phone    : document.getElementById('n-phone').value.trim(),
    product  : product,
    origin   : document.getElementById('n-origin').value.trim() || 'Portugal',
    dest     : document.getElementById('n-dest').value.trim()   || 'Moçambique',
    weight   : document.getElementById('n-weight').value.trim(),
    status   : status,
    updatedAt: fmt(new Date()),
    history  : [{ status: status, date: fmt(new Date()), note: document.getElementById('n-note').value.trim() || 'Encomenda criada no sistema.' }]
  };
  try {
    await persistOrder(order, true);
    toast('Encomenda ' + order.id + ' criada!', 'ok');
    ['n-name','n-phone','n-product','n-weight','n-note'].forEach(function(id) {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    genId();
    await renderCounters();
    switchTabByName('list');
  } catch(e) { toast('Erro ao criar: ' + e.message, 'err'); }
}

// ── EDITAR ────────────────────────────────────────────
async function editOrder(id) {
  let orders = [];
  try { orders = await getOrders(); } catch(e) { orders = localOrders(); }
  const o = orders.find(function(x) { return x.id === id; });
  if (!o) return;
  editId = id;
  document.getElementById('edit-id-lbl').textContent = id;
  document.getElementById('e-name').value    = o.name    || '';
  document.getElementById('e-phone').value   = o.phone   || '';
  document.getElementById('e-product').value = o.product || '';
  document.getElementById('e-status').value  = o.status  || '';
  document.getElementById('e-note').value    = '';
  const btn = document.getElementById('tab-edit-btn');
  if (btn) { btn.classList.remove('hidden'); switchTab(btn); }
}

async function updateOrder() {
  let orders = [];
  try { orders = await getOrders(); } catch(e) { orders = localOrders(); }
  const o = orders.find(function(x) { return x.id === editId; });
  if (!o) { toast('Encomenda não encontrada', 'err'); return; }
  const newStatus = document.getElementById('e-status').value;
  const note      = document.getElementById('e-note').value.trim();
  const now       = fmt(new Date());
  o.name      = document.getElementById('e-name').value.trim()    || o.name;
  o.phone     = document.getElementById('e-phone').value.trim()   || o.phone;
  o.product   = document.getElementById('e-product').value.trim() || o.product;
  o.status    = newStatus;
  o.updatedAt = now;
  if (!Array.isArray(o.history)) o.history = [];
  o.history.push({ status: newStatus, date: now, note: note || 'Estado atualizado.' });
  try {
    await persistOrder(o, false);
    await renderCounters();
    await renderTable();
    waPhone = o.phone || '';
    const fn = (o.name||'Cliente').split(' ')[0];
    waMsg = 'Olá ' + fn + '! 👋\n\nA sua encomenda foi atualizada.\n\n'
      + '📦 ID: *' + o.id + '*\n'
      + '🏷️ Produto: ' + o.product + '\n'
      + '🔄 Novo estado: *' + newStatus + '*\n'
      + '🗓️ Data: ' + now
      + (note ? '\n\n📝 ' + note : '')
      + '\n\n━━━━━━━━━━━━━━━\nFly Way Logistics 🚀\nPortugal → Moçambique';
    const wmsg = document.getElementById('wa-msg-txt');
    if (wmsg) wmsg.textContent = waMsg;
    const mwa = document.getElementById('modal-wa');
    if (mwa) mwa.classList.remove('hidden');
    toast('Encomenda atualizada!', 'ok');
  } catch(e) { toast('Erro ao atualizar: ' + e.message, 'err'); }
}

// ── ELIMINAR ──────────────────────────────────────────
function promptDel(id) {
  deleteId = id;
  const m = document.getElementById('modal-del');
  if (m) m.classList.remove('hidden');
}
async function confirmDelete() {
  try {
    await removeOrder(deleteId);
    closeModal('modal-del');
    await initAdmin();
    toast('Eliminada.', 'ok');
  } catch(e) { toast('Erro ao eliminar: ' + e.message, 'err'); }
}

// ── SETTINGS ──────────────────────────────────────────
function loadSettingsUI() {
  const url    = getGsUrl();
  const inp    = document.getElementById('gs-url-inp');
  const banner = document.getElementById('mode-banner');
  const shareBox = document.getElementById('share-box');
  if (inp) inp.value = url;

  if (useSheets()) {
    if (banner) {
      banner.className = 'mode-banner mode-sheets';
      banner.innerHTML = '<div class="mode-banner-icon">✅</div>'
        + '<div class="mode-banner-body">'
        + '<div class="mode-banner-title">Google Sheets ativo!</div>'
        + '<div class="mode-banner-desc">Dados ligados ao Google Sheets. Qualquer cliente que abra o link do site consegue rastrear a sua encomenda.</div>'
        + '</div>';
    }
    const shareInp = document.getElementById('share-url-display');
    if (shareInp) shareInp.value = buildShareLink();
    if (shareBox) shareBox.style.display = 'block';
  } else {
    if (banner) {
      banner.className = 'mode-banner mode-local';
      banner.innerHTML = '<div class="mode-banner-icon">📂</div>'
        + '<div class="mode-banner-body">'
        + '<div class="mode-banner-title">Modo local — sem ligação ao Sheets</div>'
        + '<div class="mode-banner-desc">Configure o URL do Apps Script abaixo e clique "Guardar e Ativar". Depois faça upload do config.js actualizado para o GitHub.</div>'
        + '</div>';
    }
    if (shareBox) shareBox.style.display = 'none';
  }
}

async function testUrl() {
  const inp = document.getElementById('gs-url-inp');
  const res = document.getElementById('test-res');
  if (!inp || !res) return;
  const url = inp.value.trim();
  res.style.display = 'block';
  res.className     = 'test-res';
  res.textContent   = '⏳ A testar ligação...';
  if (!url || url.indexOf('http') !== 0) {
    res.className   = 'test-res test-err';
    res.textContent = '❌ URL inválido. Deve começar com https://';
    return;
  }
  try {
    const r    = await fetchWithTimeout(url + '?action=getAll', { method: 'GET', redirect: 'follow' }, 15000);
    const text = await r.text();
    const d    = JSON.parse(text.trim().replace(/^\uFEFF/,''));
    if (d.ok !== undefined) {
      res.className   = 'test-res test-ok';
      res.textContent = '✅ Ligação bem sucedida! ' + (d.orders||[]).length + ' encomenda(s) encontrada(s).';
    } else throw new Error('Resposta inesperada do servidor');
  } catch(e) {
    res.className   = 'test-res test-err';
    res.textContent = '❌ ' + e.message + ' — Confirme: (1) publicou como Web App, (2) "Quem tem acesso" = Qualquer pessoa, (3) URL correcto.';
  }
}

function saveGsUrl() {
  const inp = document.getElementById('gs-url-inp');
  if (!inp) return;
  const url = inp.value.trim();
  if (!url || url.indexOf('http') !== 0) { toast('Introduza um URL válido', 'err'); return; }
  setGsUrl(url);
  loadSettingsUI();
  const btnSync = document.getElementById('btn-sync');
  if (btnSync) btnSync.classList.remove('hidden');
  toast('Guardado! Agora actualize também o config.js e faça upload para o GitHub.', 'ok');
  initAdmin();
}

function disableSheets() {
  clearGsUrl();
  loadSettingsUI();
  const btnSync = document.getElementById('btn-sync');
  if (btnSync) btnSync.classList.add('hidden');
  toast('Google Sheets desativado. A usar modo local.', 'ok');
}

function copyShareLink() {
  const link = buildShareLink();
  if (!link) { toast('URL do site não disponível', 'err'); return; }
  function copy(t) {
    const ta = document.createElement('textarea');
    ta.value = t; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(markShareCopied).catch(function() { copy(link); markShareCopied(); });
  } else { copy(link); markShareCopied(); }
}

function markShareCopied() {
  const btn = document.getElementById('btn-copy-share');
  if (btn) { btn.textContent = '✓ Copiado!'; btn.classList.add('copied'); }
  setTimeout(function() {
    if (btn) { btn.textContent = 'Copiar Link'; btn.classList.remove('copied'); }
  }, 2500);
  toast('Link copiado!', 'ok');
}

function changePass() {
  const np = (document.getElementById('new-pass')||{}).value || '';
  const cp = (document.getElementById('conf-pass')||{}).value || '';
  if (!np || np.length < 6) { toast('Senha deve ter mínimo 6 caracteres', 'err'); return; }
  if (np !== cp)             { toast('As senhas não coincidem', 'err'); return; }
  S.set('pass', np);
  document.getElementById('new-pass').value  = '';
  document.getElementById('conf-pass').value = '';
  toast('Senha alterada com sucesso!', 'ok');
}

// ── WHATSAPP ──────────────────────────────────────────
function openWA() {
  const ph = waPhone.replace(/[^0-9]/g,'');
  window.open((ph ? 'https://wa.me/'+ph : 'https://wa.me/') + '?text=' + encodeURIComponent(waMsg), '_blank');
}

// ── MODAIS ────────────────────────────────────────────
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
document.querySelectorAll('.modal-bg').forEach(function(m) {
  m.addEventListener('click', function(e) { if (e.target === this) closeModal(this.id); });
});

// ── TOAST ─────────────────────────────────────────────
function toast(msg, type) {
  type = type || 'ok';
  const t = document.createElement('div');
  t.className = 'toast t-' + (type === 'ok' ? 'ok' : 'err');
  t.textContent = (type === 'ok' ? '✓ ' : '✗ ') + msg;
  document.body.appendChild(t);
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
}

// ── UTILS ─────────────────────────────────────────────
function fmt(d) {
  return d.toLocaleDateString('pt-PT', { day:'2-digit', month:'2-digit', year:'numeric' })
    + ' ' + d.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' });
}

// ── INIT ──────────────────────────────────────────────
updateHomeUI();
