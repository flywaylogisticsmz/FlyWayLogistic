/**
 * ═══════════════════════════════════════════════════════════
 *  FLY WAY LOGISTIC — GOOGLE APPS SCRIPT BACKEND
 *  Cole este código no Google Apps Script e faça o deploy
 *  como Web App (qualquer pessoa pode aceder).
 *  
 *  SETUP:
 *  1. Abra https://script.google.com
 *  2. Crie um novo projeto
 *  3. Cole todo este código
 *  4. Execute setupSheets() UMA VEZ para criar as folhas
 *  5. Execute createDefaultAdmin() UMA VEZ para criar o admin
 *  6. Deploy > New Deployment > Web App
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  7. Copie a URL e cole em js/config.js
 * ═══════════════════════════════════════════════════════════
 */

// ── CONFIGURAÇÃO ──────────────────────────────────────────
const SS_ID = "SEU_SPREADSHEET_ID_AQUI"; // ID do Google Sheets
// Exemplo: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"

const SHEET = {
  ORDERS: "Encomendas",
  USERS: "Utilizadores",
  HISTORY: "Historico",
  SETTINGS: "Configuracoes"
};

// ── SETUP ─────────────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.openById(SS_ID);
  
  // ENCOMENDAS
  let sh = ss.getSheetByName(SHEET.ORDERS) || ss.insertSheet(SHEET.ORDERS);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["ID","Código","Cliente","Contacto","Produto","País/Rota","Estado","Data","Atualizado","Observação"]);
    sh.getRange(1,1,1,10).setFontWeight("bold").setBackground("#f88224").setFontColor("#000000");
  }
  
  // UTILIZADORES
  let su = ss.getSheetByName(SHEET.USERS) || ss.insertSheet(SHEET.USERS);
  if (su.getLastRow() === 0) {
    su.appendRow(["ID","Nome","Username","Password","Papel","Criado"]);
    su.getRange(1,1,1,6).setFontWeight("bold").setBackground("#f88224").setFontColor("#000000");
  }
  
  // HISTÓRICO
  let sh2 = ss.getSheetByName(SHEET.HISTORY) || ss.insertSheet(SHEET.HISTORY);
  if (sh2.getLastRow() === 0) {
    sh2.appendRow(["ID Encomenda","Código","Estado Anterior","Novo Estado","Data","Observação","Utilizador"]);
    sh2.getRange(1,1,1,7).setFontWeight("bold").setBackground("#f88224").setFontColor("#000000");
  }
  
  // CONFIGURAÇÕES
  let sc = ss.getSheetByName(SHEET.SETTINGS) || ss.insertSheet(SHEET.SETTINGS);
  if (sc.getLastRow() === 0) {
    sc.appendRow(["Chave","Valor"]);
    sc.appendRow(["pricePTMZ","8.50"]);
    sc.appendRow(["priceMZPT","450"]);
    sc.appendRow(["taxCustoms","5"]);
    sc.appendRow(["avgDays","14"]);
    sc.getRange(1,1,1,2).setFontWeight("bold").setBackground("#f88224").setFontColor("#000000");
  }
  
  Logger.log("✅ Folhas criadas com sucesso!");
}

function createDefaultAdmin() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.USERS);
  sh.appendRow([
    Utilities.getUuid(),
    "Administrador",
    "admin",
    "admin123", // ALTERE ESTA PALAVRA-PASSE APÓS O PRIMEIRO LOGIN
    "admin",
    new Date().toISOString()
  ]);
  Logger.log("✅ Admin criado: username=admin / password=admin123");
}

// ── HTTP HANDLERS ─────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  try {
    let result;
    switch(action) {
      case "getPublicStats": result = getPublicStats(); break;
      case "getOrders":      result = getOrders(e); break;
      case "getOrder":       result = getOrder(e.parameter.code); break;
      case "getDashboard":   result = getDashboard(e); break;
      case "getUsers":       result = getUsers(e); break;
      case "getSettings":    result = getSettings(e); break;
      default: result = { error: "Ação desconhecida: " + action };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;
    switch(action) {
      case "login":         result = login(body); break;
      case "createOrder":   result = createOrder(body); break;
      case "updateOrder":   result = updateOrder(body); break;
      case "deleteOrder":   result = deleteOrder(body); break;
      case "updateStatus":  result = updateStatus(body); break;
      case "createUser":    result = createUser(body); break;
      case "updateUser":    result = updateUser(body); break;
      case "deleteUser":    result = deleteUser(body); break;
      case "saveSettings":  result = saveSettings(body); break;
      default: result = { error: "Ação desconhecida: " + action };
    }
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── AUTH ──────────────────────────────────────────────────
function login(body) {
  const { username, password } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const [id, name, uname, pass, role] = rows[i];
    if (uname === username && pass === password) {
      return { user: { id, name, username: uname, role } };
    }
  }
  throw new Error("Credenciais inválidas.");
}

// ── PUBLIC STATS ──────────────────────────────────────────
function getPublicStats() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  let total = 0, transit = 0, delivered = 0;
  for (let i = 1; i < rows.length; i++) {
    total++;
    const status = rows[i][6];
    if (status === "Em trânsito") transit++;
    if (status === "Entregue") delivered++;
  }
  return { total, transit, delivered };
}

// ── ORDERS ────────────────────────────────────────────────
function getOrders() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  const orders = [];
  for (let i = 1; i < rows.length; i++) {
    orders.push(rowToOrder(rows[i]));
  }
  return { orders: orders.reverse() };
}

function getOrder(code) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === code || rows[i][0] === code) {
      return { order: rowToOrder(rows[i]) };
    }
  }
  throw new Error("Encomenda não encontrada.");
}

function rowToOrder(row) {
  return {
    id: row[0], code: row[1], client: row[2], contact: row[3],
    product: row[4], country: row[5], status: row[6],
    date: row[7] ? new Date(row[7]).toISOString() : "",
    updatedDate: row[8] ? new Date(row[8]).toISOString() : "",
    obs: row[9]
  };
}

function generateCode() {
  const now = new Date();
  const d = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMddHHmm");
  return `FLY-Encomenda-${d}`;
}

function createOrder(body) {
  const { order } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const id = Utilities.getUuid();
  const code = generateCode();
  const now = new Date().toISOString();
  sh.appendRow([id, code, order.client, order.contact, order.product, order.country, order.status || "Recebida", now, now, order.obs || ""]);
  return { success: true, id, code };
}

function updateOrder(body) {
  const { id, order } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const r = i + 1;
      sh.getRange(r, 3).setValue(order.client);
      sh.getRange(r, 4).setValue(order.contact);
      sh.getRange(r, 5).setValue(order.product);
      sh.getRange(r, 6).setValue(order.country);
      sh.getRange(r, 7).setValue(order.status);
      sh.getRange(r, 9).setValue(new Date().toISOString());
      sh.getRange(r, 10).setValue(order.obs || "");
      return { success: true };
    }
  }
  throw new Error("Encomenda não encontrada.");
}

function deleteOrder(body) {
  const { id } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { sh.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error("Encomenda não encontrada.");
}

function updateStatus(body) {
  const { id, status, obs } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const r = i + 1;
      const oldStatus = rows[i][6];
      const code = rows[i][1];
      sh.getRange(r, 7).setValue(status);
      sh.getRange(r, 9).setValue(new Date().toISOString());
      if (obs) sh.getRange(r, 10).setValue(obs);
      // Log to history
      const hist = ss.getSheetByName(SHEET.HISTORY);
      hist.appendRow([id, code, oldStatus, status, new Date().toISOString(), obs || "", ""]);
      return { success: true };
    }
  }
  throw new Error("Encomenda não encontrada.");
}

// ── DASHBOARD ─────────────────────────────────────────────
function getDashboard() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  
  const stats = { total:0, transit:0, delivered:0, pending:0, cancelled:0, month:0,
                  received:0, processing:0, customs:0, delivery:0 };
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const allOrders = [];
  const recent = [];
  
  for (let i = 1; i < rows.length; i++) {
    const o = rowToOrder(rows[i]);
    allOrders.push(o);
    stats.total++;
    const d = o.date ? o.date.slice(0,7) : "";
    if (d === thisMonth) stats.month++;
    switch(o.status) {
      case "Recebida": stats.received++; stats.pending++; break;
      case "Em processamento": stats.processing++; stats.pending++; break;
      case "Em trânsito": stats.transit++; break;
      case "Em alfândega": stats.customs++; break;
      case "Saiu para entrega": stats.delivery++; break;
      case "Entregue": stats.delivered++; break;
      case "Cancelada": stats.cancelled++; break;
    }
  }
  
  const sorted = [...allOrders].sort((a,b) => (b.date||"").localeCompare(a.date||""));
  
  return { stats, recent: sorted.slice(0,8), allOrders };
}

// ── USERS ─────────────────────────────────────────────────
function getUsers() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < rows.length; i++) {
    users.push({ id: rows[i][0], name: rows[i][1], username: rows[i][2], role: rows[i][4], created: rows[i][5] });
  }
  return { users };
}

function createUser(body) {
  const { user } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.USERS);
  // Check duplicate username
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][2] === user.username) throw new Error("Username já existe.");
  }
  const id = Utilities.getUuid();
  sh.appendRow([id, user.name, user.username, user.password, user.role, new Date().toISOString()]);
  return { success: true, id };
}

function updateUser(body) {
  const { id, user } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const r = i + 1;
      sh.getRange(r, 2).setValue(user.name);
      sh.getRange(r, 3).setValue(user.username);
      if (user.password) sh.getRange(r, 4).setValue(user.password);
      sh.getRange(r, 5).setValue(user.role);
      return { success: true };
    }
  }
  throw new Error("Utilizador não encontrado.");
}

function deleteUser(body) {
  const { id } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { sh.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error("Utilizador não encontrado.");
}

// ── SETTINGS ──────────────────────────────────────────────
function getSettings() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.SETTINGS);
  const rows = sh.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    settings[rows[i][0]] = rows[i][1];
  }
  return { settings };
}

function saveSettings(body) {
  const { settings } = body;
  const ss = SpreadsheetApp.openById(SS_ID);
  const sh = ss.getSheetByName(SHEET.SETTINGS);
  const rows = sh.getDataRange().getValues();
  Object.entries(settings).forEach(([key, val]) => {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) { sh.getRange(i+1, 2).setValue(val); found = true; break; }
    }
    if (!found) sh.appendRow([key, val]);
  });
  return { success: true };
}
