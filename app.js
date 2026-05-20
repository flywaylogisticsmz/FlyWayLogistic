// ════════════════════════════════════════════════════
// Fly Way Logistics — app.js
// Lógica principal: rastreamento, admin, Google Sheets
// ════════════════════════════════════════════════════

// ── CONSTANTES ──────────────────────────────────────
const STEPS = [
  { key: 'Em processamento', icon: '📋', lbl: 'Em processamento' },
  { key: 'Recolhido',        icon: '🚚', lbl: 'Recolhido'        },
  { key: 'Em trânsito',      icon: '✈️', lbl: 'Em trânsito'      },
  { key: 'Em alfândega',     icon: '🛃', lbl: 'Em alfândega'     },
  { key: 'Chegou ao destino',icon: '📍', lbl: 'Chegado'          },
  { key: 'Saiu para entrega',icon: '🛵', lbl: 'Para entrega'     },
  { key: 'Entregue',         icon: '✅', lbl: 'Entregue'         }
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
// Prioridade (maior para menor):
//   1) parâmetro ?gs= na URL       → partilha temporária / teste
//   2) localStorage (admin guardou via painel)
//   3) config.js → sheets.urlFixo  ← FONTE PRINCIPAL para clientes
//   4) vazio → modo local/demo
//
// Para que TODOS os clientes vejam as encomendas sem configuração extra,
// basta preencher o campo urlFixo no config.js e fazer push para o GitHub.
// ════════════════════════════════════════════════════
function getGsUrl() {
  // 1. Parâmetro na URL (?gs=...)
  const params  = new URLSearchParams(window.location.search);
  const fromUrl = params.get('gs');
  if (fromUrl && fromUrl.startsWith('http')) return fromUrl;

  // 2. localStorage (guardado pelo admin no painel de Definições)
  const fromStorage = localStorage.getItem('fw_gs_url');
  if (fromStorage && fromStorage.startsWith('http')) return fromStorage;

  // 3. URL fixo no config.js — garante acesso a TODOS os visitantes
  const fromConfig = window.FLY_CONFIG?.sheets?.urlFixo;
  if (fromConfig && fromConfig.startsWith('http')) return fromConfig;

  return '';
}

function setGsUrl(url) {
  localStorage.setItem('fw_gs_url', url);
  // Sincronia: se o config já tiver um urlFixo diferente, o localStorage prevalece
}
function clearGsUrl()   { localStorage.removeItem('fw_gs_url'); }
function useSheets()    { return !!getGsUrl(); }

// O link de partilha usa sempre o URL activo (qualquer das 3 fontes)
function buildShareLink() {
  const gsUrl = getGsUrl();
  if (!gsUrl) return '';
  const base = window.location.href.split('?')[0].split('#')[0];
  return base + '?gs=' + encodeURIComponent(gsUrl);
}

// ── CONFIGURAÇÕES (senha) ────────────────────────────
const S = {
  get: (k, d = '') => localStorage.getItem('fw_' + k) || d,
  set: (k, v)      => localStorage.setItem('fw_' + k, v)
};
const getPass = () => S.get('pass', 'flyadmin123');

// ════════════════════════════════════════════════════
// DADOS LOCAIS (demo / fallback quando não há Sheets)
// ════════════════════════════════════════════════════
function localOrders() {
  const r = localStorage.getItem('fw_orders');
  return r ? JSON.parse(r) : initDemo();
}
function saveLocal(o) { localStorage.setItem('fw_orders', JSON.stringify(o)); }

function initDemo() {
  const now = Date.now();
  const d = [
    {
      id: 'FLY10001', name: 'João Manuel Silva', phone: '+258841234567',
      product: 'Smartphone Samsung Galaxy S24 Ultra',
      origin: 'Lisboa, Portugal', dest: 'Maputo, Moçambique', weight: '0.5',
      status: 'Em trânsito', updatedAt: fmt(new Date()),
      history: [
        { status: 'Em processamento', date: fmt(new Date(now - 86400000 * 3)), note: 'Encomenda recebida na loja de Lisboa. Referência interna #9821.' },
        { status: 'Recolhido',        date: fmt(new Date(now - 86400000 * 2)), note: 'Recolhida e enviada para o armazém de Lisboa.' },
        { status: 'Em trânsito',      date: fmt(new Date(now - 86400000)),     note: 'Embarcada no voo TP286 Lisboa–Maputo. Chegada prevista em 2 dias.' }
      ]
    },
    {
      id: 'FLY10002', name: 'Maria da Conceição Santos', phone: '+258821111222',
      product: 'Roupas e acessórios (3 volumes)',
      origin: 'Porto, Portugal', dest: 'Beira, Moçambique', weight: '8.2',
      status: 'Em processamento', updatedAt: fmt(new Date()),
      history: [
        { status: 'Em processamento', date: fmt(new Date()), note: 'Encomenda registada. Recolha prevista para amanhã.' }
      ]
    },
    {
      id: 'FLY10003', name: 'Carlos Armando Mendes', phone: '+258843333444',
      product: 'Laptop Dell XPS 15 + acessórios',
      origin: 'Faro, Portugal', dest: 'Nampula, Moçambique', weight: '3.1',
      status: 'Entregue', updatedAt: fmt(new Date(now - 86400000)),
      history: [
        { status: 'Em processamento',  date: fmt(new Date(now - 86400000 * 7)),          note: 'Encomenda recebida na loja de Faro.' },
        { status: 'Recolhido',         date: fmt(new Date(now - 86400000 * 6)),          note: 'Enviada para armazém de Lisboa.' },
        { status: 'Em trânsito',       date: fmt(new Date(now - 86400000 * 4)),          note: 'Embarcada no voo TAP TP286.' },
        { status: 'Em alfândega',      date: fmt(new Date(now - 86400000 * 3)),          note: 'Em desalfandegamento em Maputo.' },
        { status: 'Chegou ao destino', date: fmt(new Date(now - 86400000 * 2)),          note: 'Chegou ao armazém de Nampula.' },
        { status: 'Saiu para entrega', date: fmt(new Date(now - 86400000)),              note: 'Saiu para entrega com o motorista João.' },
        { status: 'Entregue',          date: fmt(new Date(now - 86400000 + 7200000)),    note: 'Entregue com sucesso. Assinado pelo próprio cliente.' }
      ]
    }
  ];
  saveLocal(d);
  return d;
}

// ════════════════════════════════════════════════════
// API GOOGLE SHEETS
// ════════════════════════════════════════════════════
async function sheetsCall(params) {
  const url = getGsUrl();
  if (!url) throw new Error('URL não configurado');
  const qs = Object.keys(params).map(k => {
    const v = typeof params[k] === 'object'
      ? encodeURIComponent(JSON.stringify(params[k]))
      : encodeURIComponent(String(params[k]));
    return k + '=' + v;
  }).join('&');
  const res  = await fetch(url + '?' + qs);
  const data = await res.json();
  if (data.ok === false) throw new Error(data.error || 'Erro no servidor');
  return data;
}

async function getOrders() {
  if (!useSheets()) return localOrders();
  try {
    const r = await sheetsCall({ action: 'getAll' });
    return r.orders || [];
  } catch (e) {
    toast('Sheets inacessível — dados locais', 'err');
    return localOrders();
  }
}

async function persistOrder(order, isNew) {
  const local = localOrders();
  if (isNew) local.unshift(order);
  else { const i = local.findIndex(o => o.id === order.id); if (i >= 0) local[i] = order; }
  saveLocal(local);
  if (!useSheets()) return;
  await sheetsCall({ action: isNew ? 'create' : 'update', data: order });
}

async function removeOrder(id) {
  saveLocal(localOrders().filter(o => o.id !== id));
  if (!useSheets()) return;
  await sheetsCall({ action: 'delete', id });
}

// ════════════════════════════════════════════════════
// VISTAS
// ════════════════════════════════════════════════════
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

function goHome() {
  document.getElementById('track-input').value = '';
  updateHomeUI();
  showView('home');
}

function openAdmin() {
  if (sessionStorage.getItem('fw_auth') === '1') { showView('admin'); initAdmin(); }
  else showView('login');
}

// ════════════════════════════════════════════════════
// UI DA PÁGINA INICIAL
// ════════════════════════════════════════════════════
async function updateHomeUI() {
  updateNavBadge();
  const alert    = document.getElementById('no-sheets-alert');
  const examples = document.getElementById('hero-hint-examples');

  if (!useSheets()) {
    alert.style.display    = 'flex';
    examples.style.display = 'none';
    document.getElementById('s-total').textContent   = '—';
    document.getElementById('s-transit').textContent = '—';
    document.getElementById('s-done').textContent    = '—';
  } else {
    alert.style.display    = 'none';
    examples.style.display = 'block';
    try {
      const orders = await getOrders();
      document.getElementById('s-total').textContent   = orders.length;
      document.getElementById('s-transit').textContent = orders.filter(o => ['Em trânsito', 'Em alfândega', 'Saiu para entrega'].includes(o.status)).length;
      document.getElementById('s-done').textContent    = orders.filter(o => o.status === 'Entregue').length;
    } catch (e) { /* silencioso */ }
  }
}

function updateNavBadge() {
  // Badge removido da navbar — função mantida para compatibilidade interna
}

// ════════════════════════════════════════════════════
// RASTREAMENTO
// ════════════════════════════════════════════════════
async function doTrack() {
  const val = document.getElementById('track-input').value.trim().toUpperCase();
  if (!val) { toast('Introduza um código de rastreamento', 'err'); return; }

  if (!useSheets()) {
    toast('Sistema sem base de dados configurada. Contacte o administrador.', 'err');
    return;
  }

  showView('loading');
  try {
    const orders = await getOrders();
    const o      = orders.find(x => x.id === val);
    document.getElementById('result-content').innerHTML = o ? buildResult(o) : buildNotFound(val);
    showView('result');
  } catch (e) {
    toast('Erro ao pesquisar: ' + e.message, 'err');
    showView('home');
  }
}

function buildNotFound(id) {
  return `<div class="not-found">
    <div class="nf-icon">🔍</div>
    <div class="nf-h">Encomenda não encontrada</div>
    <p class="nf-p">O código <strong>${id}</strong> não existe no sistema.<br>Verifique o código e tente novamente.</p>
    <button class="btn-prim" style="margin-top:24px" onclick="goHome()">Tentar novamente</button>
  </div>`;
}

function buildResult(o) {
  const si        = STEPS.findIndex(s => s.key === o.status);
  const stepsHTML = STEPS.map((s, i) => {
    const c = i < si ? 'done' : i === si ? 'active' : 'pending';
    return `<div class="step-it ${c}">
      <div class="step-dot ${c}">${s.icon}</div>
      <div class="step-lbl ${c}">${s.lbl}</div>
    </div>`;
  }).join('');

  const histHTML = [...o.history].reverse().map((h, i) => {
    const si2 = STEPS.findIndex(s => s.key === h.status);
    const ic  = si2 >= 0 ? STEPS[si2].icon : '📦';
    return `<div class="tl-it">
      <div class="tl-dot ${i === 0 ? 'cur' : 'old'}">${ic}</div>
      <div class="tl-body">
        <div class="tl-stat ${i === 0 ? 'cur' : ''}">${h.status}</div>
        <div class="tl-date">${h.date}</div>
        ${h.note ? `<div class="tl-note">${h.note}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const badge = SCSS[o.status] || 'sp-proc';
  return `
  <div class="order-card">
    <div class="order-top">
      <div class="order-icon-wrap">
        <div class="order-ico"><svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg></div>
        <div><div class="order-id-txt">${o.id}</div><div class="order-cust">${o.name}</div></div>
      </div>
      <span class="status-pill ${badge}">${o.status}</span>
    </div>
    <div class="route-vis">
      <div class="route-pt"><div class="route-flag">🇵🇹</div><div class="route-name">Portugal</div><div class="route-city">${o.origin}</div></div>
      <div class="route-mid">
        <div class="route-ln"><div class="route-ln-plane"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></div></div>
        <div class="route-eta">Rota aérea direta</div>
      </div>
      <div class="route-pt"><div class="route-flag">🇲🇿</div><div class="route-name">Moçambique</div><div class="route-city">${o.dest}</div></div>
    </div>
    <div class="order-meta">
      <div class="meta-item"><label>Produto</label><span>${o.product}</span></div>
      <div class="meta-item"><label>Peso</label><span>${o.weight || '—'} kg</span></div>
      <div class="meta-item"><label>Última atualização</label><span>${o.updatedAt}</span></div>
      <div class="meta-item"><label>Contacto</label><span>${o.phone || '—'}</span></div>
    </div>
  </div>
  <div class="timeline-card" style="margin-top:0">
    <div class="sec-title">Progresso da entrega</div>
    <div class="steps-bar">${stepsHTML}</div>
    <div class="sec-title">Histórico completo</div>
    <div class="tl-list">${histHTML}</div>
  </div>`;
}

// ════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ════════════════════════════════════════════════════
function doLogin() {
  const p   = document.getElementById('admin-pass').value;
  const err = document.getElementById('login-err');
  if (p === getPass()) {
    sessionStorage.setItem('fw_auth', '1');
    err.classList.add('hidden');
    document.getElementById('admin-pass').value = '';
    showView('admin');
    initAdmin();
  } else {
    err.classList.remove('hidden');
  }
}
function doLogout() { sessionStorage.removeItem('fw_auth'); showView('home'); }

// ════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════
async function initAdmin() {
  if (sessionStorage.getItem('fw_auth') !== '1') { showView('login'); return; }
  genId();
  loadSettingsUI();
  updateNavBadge();
  document.getElementById('btn-sync').classList.toggle('hidden', !useSheets());
  await renderCounters();
  await renderTable();
}

async function syncSheets() {
  toast('A sincronizar...', 'ok');
  await initAdmin();
  toast('Sincronizado!', 'ok');
}

async function renderCounters() {
  const o = await getOrders();
  let pr = 0, tr = 0, dn = 0;
  o.forEach(x => {
    if (['Em processamento', 'Recolhido'].includes(x.status)) pr++;
    else if (['Em trânsito', 'Em alfândega', 'Chegou ao destino', 'Saiu para entrega'].includes(x.status)) tr++;
    else if (x.status === 'Entregue') dn++;
  });
  document.getElementById('counters').innerHTML = `
    <div class="cnt-card"><div class="cnt-n">${o.length}</div><div class="cnt-l">Total</div></div>
    <div class="cnt-card"><div class="cnt-n" style="color:var(--warn)">${pr}</div><div class="cnt-l">Em Processamento</div></div>
    <div class="cnt-card"><div class="cnt-n" style="color:#5B21B6">${tr}</div><div class="cnt-l">Em Trânsito</div></div>
    <div class="cnt-card"><div class="cnt-n" style="color:var(--ok)">${dn}</div><div class="cnt-l">Entregues</div></div>`;
}

async function renderTable() {
  const q   = (document.getElementById('srch-inp') || { value: '' }).value.toLowerCase();
  let o     = await getOrders();
  if (q) o  = o.filter(x => x.id.toLowerCase().includes(q) || x.name.toLowerCase().includes(q) || (x.product || '').toLowerCase().includes(q));
  const cnt = document.getElementById('tbl-count');
  if (cnt) cnt.textContent = o.length + ' encomenda(s)';
  const b = document.getElementById('tbl-body');
  if (!b) return;
  if (!o.length) { b.innerHTML = `<tr><td colspan="7"><div class="empty-tbl">Nenhuma encomenda encontrada</div></td></tr>`; return; }
  b.innerHTML = o.map(x => {
    const bg = SCSS[x.status] || 'sp-proc';
    const pr = (x.product || '').length > 30 ? x.product.slice(0, 30) + '…' : (x.product || '');
    return `<tr>
      <td><span class="tbl-id">${x.id}</span></td>
      <td style="font-weight:600">${x.name}</td>
      <td title="${x.product || ''}">${pr}</td>
      <td style="color:var(--g5)">${x.dest}</td>
      <td><span class="status-pill ${bg}" style="font-size:10px;padding:5px 10px">${x.status}</span></td>
      <td style="color:var(--g5);font-size:12px">${x.updatedAt}</td>
      <td><div class="tbl-acts">
        <button class="btn-sm btn-edit" onclick="editOrder('${x.id}')">Editar</button>
        <button class="btn-sm btn-del"  onclick="promptDel('${x.id}')">Eliminar</button>
      </div></td>
    </tr>`;
  }).join('');
}

function switchTab(btn) {
  const panel = btn.dataset.panel;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  ['list', 'new', 'edit', 'settings'].forEach(p => {
    const el = document.getElementById('panel-' + p);
    if (el) el.classList.toggle('hidden', p !== panel);
  });
  if (panel === 'list')     renderTable();
  if (panel === 'new')      genId();
  if (panel === 'settings') loadSettingsUI();
}

function switchTabByName(name) {
  const btn = document.querySelector(`.tab[data-panel="${name}"]`);
  if (btn) switchTab(btn);
}

// ── CRIAR ENCOMENDA ─────────────────────────────────
function genId() {
  const o    = localOrders();
  const nums = o.map(x => parseInt(x.id.replace('FLY', '')) || 0);
  const next = (Math.max(0, ...nums) + 1).toString().padStart(5, '0');
  const el   = document.getElementById('n-id');
  if (el) el.value = 'FLY' + next;
}

async function createOrder() {
  const name    = document.getElementById('n-name').value.trim();
  const product = document.getElementById('n-product').value.trim();
  if (!name || !product) { toast('Nome e produto são obrigatórios', 'err'); return; }
  const status = document.getElementById('n-status').value;
  const order  = {
    id      : document.getElementById('n-id').value,
    name,
    phone   : document.getElementById('n-phone').value.trim(),
    product,
    origin  : document.getElementById('n-origin').value.trim() || 'Portugal',
    dest    : document.getElementById('n-dest').value.trim()   || 'Moçambique',
    weight  : document.getElementById('n-weight').value.trim(),
    status,
    updatedAt: fmt(new Date()),
    history : [{ status, date: fmt(new Date()), note: document.getElementById('n-note').value.trim() || 'Encomenda criada no sistema.' }]
  };
  try {
    await persistOrder(order, true);
    toast('Encomenda ' + order.id + ' criada!', 'ok');
    ['n-name', 'n-phone', 'n-product', 'n-weight', 'n-note'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    genId();
    await renderCounters();
    switchTabByName('list');
  } catch (e) { toast('Erro ao criar: ' + e.message, 'err'); }
}

// ── EDITAR / ATUALIZAR ───────────────────────────────
async function editOrder(id) {
  const o = (await getOrders()).find(x => x.id === id);
  if (!o) return;
  editId = id;
  document.getElementById('edit-id-lbl').textContent  = id;
  document.getElementById('e-name').value             = o.name;
  document.getElementById('e-phone').value            = o.phone || '';
  document.getElementById('e-product').value          = o.product;
  document.getElementById('e-status').value           = o.status;
  document.getElementById('e-note').value             = '';
  const btn = document.getElementById('tab-edit-btn');
  btn.classList.remove('hidden');
  switchTab(btn);
}

async function updateOrder() {
  const o         = (await getOrders()).find(x => x.id === editId);
  if (!o) return;
  const newStatus = document.getElementById('e-status').value;
  const note      = document.getElementById('e-note').value.trim();
  const now       = fmt(new Date());
  o.name          = document.getElementById('e-name').value.trim()    || o.name;
  o.phone         = document.getElementById('e-phone').value.trim()   || o.phone;
  o.product       = document.getElementById('e-product').value.trim() || o.product;
  o.status        = newStatus;
  o.updatedAt     = now;
  o.history.push({ status: newStatus, date: now, note: note || 'Estado atualizado.' });
  try {
    await persistOrder(o, false);
    await renderCounters();
    await renderTable();
    waPhone = o.phone || '';
    const fn = o.name.split(' ')[0];
    waMsg = `Olá ${fn}! 👋\n\nA sua encomenda foi atualizada.\n\n📦 ID: *${o.id}*\n🏷️ Produto: ${o.product}\n🔄 Novo estado: *${newStatus}*\n🗓️ Data: ${now}${note ? '\n\n📝 ' + note : ''}\n\n━━━━━━━━━━━━━━━\nFly Way Logistics 🚀\nPortugal → Moçambique`;
    document.getElementById('wa-msg-txt').textContent = waMsg;
    document.getElementById('modal-wa').classList.remove('hidden');
    toast('Encomenda atualizada!', 'ok');
  } catch (e) { toast('Erro ao atualizar: ' + e.message, 'err'); }
}

// ── ELIMINAR ─────────────────────────────────────────
function promptDel(id) {
  deleteId = id;
  document.getElementById('modal-del').classList.remove('hidden');
}
async function confirmDelete() {
  try {
    await removeOrder(deleteId);
    closeModal('modal-del');
    await initAdmin();
    toast('Eliminada.', 'ok');
  } catch (e) { toast('Erro ao eliminar', 'err'); }
}

// ── SETTINGS ─────────────────────────────────────────
function loadSettingsUI() {
  const url = getGsUrl();
  const inp = document.getElementById('gs-url-inp');
  if (inp) inp.value = url;

  const banner   = document.getElementById('mode-banner');
  const shareBox = document.getElementById('share-box');

  if (useSheets()) {
    banner.className = 'mode-banner mode-sheets';
    banner.innerHTML = `<div class="mode-banner-icon">✅</div>
      <div class="mode-banner-body">
        <div class="mode-banner-title">Google Sheets ativo!</div>
        <div class="mode-banner-desc">Os dados são lidos e guardados na sua spreadsheet. Copie o link abaixo e partilhe com os seus clientes.</div>
      </div>`;
    const shareLink = buildShareLink();
    const shareInp  = document.getElementById('share-url-display');
    if (shareInp) shareInp.value = shareLink;
    if (shareBox) shareBox.style.display = 'block';
  } else {
    banner.className = 'mode-banner mode-local';
    banner.innerHTML = `<div class="mode-banner-icon">📂</div>
      <div class="mode-banner-body">
        <div class="mode-banner-title">Modo local ativo</div>
        <div class="mode-banner-desc">Os dados estão guardados só no seu browser. Configure o Google Sheets abaixo para que qualquer cliente possa rastrear as suas encomendas.</div>
      </div>`;
    if (shareBox) shareBox.style.display = 'none';
  }
}

async function testUrl() {
  const url = document.getElementById('gs-url-inp').value.trim();
  const res = document.getElementById('test-res');
  res.style.display = 'block'; res.className = 'test-res'; res.textContent = '⏳ A testar ligação...';
  if (!url || !url.startsWith('http')) { res.className = 'test-res test-err'; res.textContent = '❌ URL inválido. Deve começar com https://'; return; }
  try {
    const r = await fetch(url + '?action=getAll');
    const d = await r.json();
    if (d.ok !== undefined) {
      res.className   = 'test-res test-ok';
      res.textContent = `✅ Ligação bem sucedida! ${(d.orders || []).length} encomenda(s) no Google Sheets.`;
    } else throw new Error('Resposta inesperada');
  } catch (e) {
    res.className   = 'test-res test-err';
    res.textContent = '❌ Erro: ' + e.message + '. Verifique se o URL está correto e se "Quem tem acesso" está como "Qualquer pessoa".';
  }
}

function saveGsUrl() {
  const url = document.getElementById('gs-url-inp').value.trim();
  if (!url || !url.startsWith('http')) { toast('Introduza um URL válido', 'err'); return; }
  setGsUrl(url);
  updateNavBadge();
  loadSettingsUI();
  document.getElementById('btn-sync').classList.remove('hidden');
  toast('Google Sheets ativado! Copie o link de partilha.', 'ok');
  initAdmin();
}

function disableSheets() {
  clearGsUrl();
  updateNavBadge();
  loadSettingsUI();
  document.getElementById('btn-sync').classList.add('hidden');
  toast('Google Sheets desativado. Voltou ao modo local.', 'ok');
}

function copyShareLink() {
  const link = buildShareLink();
  if (!link) { toast('Ative o Google Sheets primeiro', 'err'); return; }
  const copy = t => { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(markShareCopied).catch(() => { copy(link); markShareCopied(); });
  } else { copy(link); markShareCopied(); }
}

function markShareCopied() {
  const btn = document.getElementById('btn-copy-share');
  btn.textContent = '✓ Copiado!'; btn.classList.add('copied');
  setTimeout(() => { btn.textContent = 'Copiar Link'; btn.classList.remove('copied'); }, 2500);
  toast('Link copiado! Envie aos clientes via WhatsApp ou email.', 'ok');
}

function changePass() {
  const np = document.getElementById('new-pass').value;
  const cp = document.getElementById('conf-pass').value;
  if (!np || np.length < 6) { toast('Senha deve ter mínimo 6 caracteres', 'err'); return; }
  if (np !== cp)            { toast('As senhas não coincidem', 'err'); return; }
  S.set('pass', np);
  document.getElementById('new-pass').value = '';
  document.getElementById('conf-pass').value = '';
  toast('Senha alterada!', 'ok');
}

// ── WHATSAPP ─────────────────────────────────────────
function openWA() {
  const ph = waPhone.replace(/[^0-9]/g, '');
  window.open((ph ? 'https://wa.me/' + ph : 'https://wa.me/') + '?text=' + encodeURIComponent(waMsg), '_blank');
}

// ── MODAIS & TOAST ───────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-bg').forEach(m => m.addEventListener('click', function (e) {
  if (e.target === this) closeModal(this.id);
}));

function toast(msg, type = 'ok') {
  const t = document.createElement('div');
  t.className = 'toast t-' + (type === 'ok' ? 'ok' : 'err');
  t.innerHTML = (type === 'ok' ? '✓' : '✗') + ' ' + msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ── UTILS ────────────────────────────────────────────
function fmt(d) {
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// ── INIT ─────────────────────────────────────────────
updateHomeUI();
