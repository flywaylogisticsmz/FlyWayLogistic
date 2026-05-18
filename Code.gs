/**
 * ╔══════════════════════════════════════════════════════════╗
 *  FLY WAY LOGISTIC — GOOGLE APPS SCRIPT BACKEND
 * ╠══════════════════════════════════════════════════════════╣
 *
 *  INSTRUÇÕES DE INSTALAÇÃO:
 *
 *  1. Aceda a https://script.google.com
 *  2. Crie um novo projecto: "Fly Way Logistic Backend"
 *  3. Apague o código existente e cole este ficheiro completo
 *  4. Substitua SS_ID pelo ID do seu Google Sheets
 *     (encontra-o no URL da folha, entre /d/ e /edit)
 *  5. Execute setupSheets() UMA única vez
 *  6. Execute createDefaultAdmin() UMA única vez
 *  7. Implementar → Nova implementação → Aplicação Web
 *        Executar como  : Eu (a minha conta Google)
 *        Quem tem acesso: Qualquer pessoa   ← OBRIGATÓRIO
 *  8. Copie a URL gerada e cole no ficheiro config.js
 *
 *  NOTA IMPORTANTE SOBRE CORS:
 *  Este backend usa apenas doGet() com todos os parâmetros
 *  via query string. Isso garante compatibilidade total com
 *  GitHub Pages sem erros de CORS ou "Failed to fetch".
 *
 * ╚══════════════════════════════════════════════════════════╝
 */

// ── ID DO GOOGLE SHEETS ───────────────────────────────────
const SS_ID = "SEU_SPREADSHEET_ID_AQUI";

// ── NOMES DAS FOLHAS ──────────────────────────────────────
const SHEET = {
  ORDERS:   "Encomendas",
  USERS:    "Utilizadores",
  HISTORY:  "Historico",
  SETTINGS: "Configuracoes"
};

// ══════════════════════════════════════════════════════════
//  RESPOSTA JSON (com headers CORS)
// ══════════════════════════════════════════════════════════
function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════
//  ÚNICO HANDLER — tudo via GET para evitar problemas CORS
// ══════════════════════════════════════════════════════════
function doGet(e) {
  try {
    const p      = e.parameter;
    const action = p.action || "";

    switch (action) {

      // ── Públicas (sem autenticação) ──
      case "getPublicStats": return jsonOut(getPublicStats());
      case "getOrder":       return jsonOut(getOrder(p.code));

      // ── Autenticação ──
      case "login":
        return jsonOut(login(p.username, p.password));

      // ── Encomendas ──
      case "getOrders":    return jsonOut(getOrders());
      case "getDashboard": return jsonOut(getDashboard());

      case "createOrder":
        return jsonOut(createOrder({
          client:  p.order_client  || "",
          contact: p.order_contact || "",
          product: p.order_product || "",
          country: p.order_country || "",
          status:  p.order_status  || "Recebida",
          obs:     p.order_obs     || ""
        }));

      case "updateOrder":
        return jsonOut(updateOrder(p.id, {
          client:  p.order_client  || "",
          contact: p.order_contact || "",
          product: p.order_product || "",
          country: p.order_country || "",
          status:  p.order_status  || "",
          obs:     p.order_obs     || ""
        }));

      case "deleteOrder":
        return jsonOut(deleteOrder(p.id));

      case "updateStatus":
        return jsonOut(updateStatus(p.id, p.status, p.obs || ""));

      // ── Utilizadores ──
      case "getUsers": return jsonOut(getUsers());

      case "createUser":
        return jsonOut(createUser({
          name:     p.user_name     || "",
          username: p.user_username || "",
          password: p.user_password || "",
          role:     p.user_role     || "assistente"
        }));

      case "updateUser":
        return jsonOut(updateUser(p.id, {
          name:     p.user_name     || "",
          username: p.user_username || "",
          password: p.user_password || "",
          role:     p.user_role     || "assistente"
        }));

      case "deleteUser":
        return jsonOut(deleteUser(p.id));

      // ── Configurações ──
      case "getSettings": return jsonOut(getSettings());

      case "saveSettings":
        return jsonOut(saveSettingsAction({
          pricePTMZ:  p.settings_pricePTMZ  || "",
          priceMZPT:  p.settings_priceMZPT  || "",
          taxCustoms: p.settings_taxCustoms || "",
          avgDays:    p.settings_avgDays    || ""
        }));

      default:
        return jsonOut({ error: "Acção desconhecida: " + action });
    }
  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

// ══════════════════════════════════════════════════════════
//  SETUP — Execute UMA vez
// ══════════════════════════════════════════════════════════
function setupSheets() {
  const ss = SpreadsheetApp.openById(SS_ID);

  let s1 = ss.getSheetByName(SHEET.ORDERS) || ss.insertSheet(SHEET.ORDERS);
  if (s1.getLastRow() === 0) {
    s1.appendRow(["ID","Código","Cliente","Contacto","Produto","Rota","Estado","Data Criação","Data Atualização","Observação"]);
    headerStyle(s1, 10);
  }

  let s2 = ss.getSheetByName(SHEET.USERS) || ss.insertSheet(SHEET.USERS);
  if (s2.getLastRow() === 0) {
    s2.appendRow(["ID","Nome","Username","Password","Papel","Data Criação"]);
    headerStyle(s2, 6);
  }

  let s3 = ss.getSheetByName(SHEET.HISTORY) || ss.insertSheet(SHEET.HISTORY);
  if (s3.getLastRow() === 0) {
    s3.appendRow(["ID Encomenda","Código","Estado Anterior","Novo Estado","Data","Observação"]);
    headerStyle(s3, 6);
  }

  let s4 = ss.getSheetByName(SHEET.SETTINGS) || ss.insertSheet(SHEET.SETTINGS);
  if (s4.getLastRow() === 0) {
    s4.appendRow(["Chave","Valor"]);
    s4.appendRow(["pricePTMZ","8.50"]);
    s4.appendRow(["priceMZPT","450"]);
    s4.appendRow(["taxCustoms","5"]);
    s4.appendRow(["avgDays","14"]);
    headerStyle(s4, 2);
  }

  Logger.log("✅ Folhas criadas com sucesso!");
}

function headerStyle(sheet, cols) {
  sheet.getRange(1, 1, 1, cols)
    .setFontWeight("bold")
    .setBackground("#f88224")
    .setFontColor("#000000");
}

function createDefaultAdmin() {
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === "admin") {
      Logger.log("⚠️ Admin já existe. Nada foi criado.");
      return;
    }
  }
  sh.appendRow([
    Utilities.getUuid(),
    "Administrador",
    "admin",
    "admin123",
    "admin",
    new Date().toISOString()
  ]);
  Logger.log("✅ Admin criado — username: admin  /  password: admin123");
  Logger.log("⚠️  ALTERE A PALAVRA-PASSE APÓS O PRIMEIRO LOGIN!");
}

// ══════════════════════════════════════════════════════════
//  AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════
function login(username, password) {
  if (!username || !password) throw new Error("Credenciais em falta.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    if (String(rows[i][2]) === String(username) &&
        String(rows[i][3]) === String(password)) {
      return {
        user: {
          id:       String(rows[i][0]),
          name:     String(rows[i][1]),
          username: String(rows[i][2]),
          role:     String(rows[i][4])
        }
      };
    }
  }
  throw new Error("Utilizador ou palavra-passe incorrectos.");
}

// ══════════════════════════════════════════════════════════
//  ESTATÍSTICAS PÚBLICAS
// ══════════════════════════════════════════════════════════
function getPublicStats() {
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  let total = 0, transit = 0, delivered = 0;
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    total++;
    if (String(rows[i][6]) === "Em trânsito") transit++;
    if (String(rows[i][6]) === "Entregue")    delivered++;
  }
  return { total, transit, delivered };
}

// ══════════════════════════════════════════════════════════
//  ENCOMENDAS
// ══════════════════════════════════════════════════════════
function rowToOrder(row) {
  return {
    id:          String(row[0] || ""),
    code:        String(row[1] || ""),
    client:      String(row[2] || ""),
    contact:     String(row[3] || ""),
    product:     String(row[4] || ""),
    country:     String(row[5] || ""),
    status:      String(row[6] || ""),
    date:        row[7] ? new Date(row[7]).toISOString() : "",
    updatedDate: row[8] ? new Date(row[8]).toISOString() : "",
    obs:         String(row[9] || "")
  };
}

function makeCode() {
  const tz  = Session.getScriptTimeZone();
  const now  = new Date();
  return "FLY-Encomenda-" + Utilities.formatDate(now, tz, "yyyyMMddHHmm");
}

function getOrders() {
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  const out  = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) out.push(rowToOrder(rows[i]));
  }
  return { orders: out.reverse() };
}

function getOrder(code) {
  if (!code) throw new Error("Código não fornecido.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    if (String(rows[i][1]) === String(code) ||
        String(rows[i][0]) === String(code)) {
      return { order: rowToOrder(rows[i]) };
    }
  }
  throw new Error("Encomenda não encontrada.");
}

function createOrder(o) {
  if (!o.client || !o.product || !o.country) throw new Error("Campos obrigatórios em falta.");
  const ss  = SpreadsheetApp.openById(SS_ID);
  const sh  = ss.getSheetByName(SHEET.ORDERS);
  const id  = Utilities.getUuid();
  const code = makeCode();
  const now  = new Date().toISOString();
  sh.appendRow([id, code, o.client, o.contact||"", o.product, o.country, o.status||"Recebida", now, now, o.obs||""]);
  return { success: true, id, code };
}

function updateOrder(id, o) {
  if (!id) throw new Error("ID em falta.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const r = i + 1;
      sh.getRange(r, 3).setValue(o.client);
      sh.getRange(r, 4).setValue(o.contact  || "");
      sh.getRange(r, 5).setValue(o.product);
      sh.getRange(r, 6).setValue(o.country);
      sh.getRange(r, 7).setValue(o.status);
      sh.getRange(r, 9).setValue(new Date().toISOString());
      sh.getRange(r, 10).setValue(o.obs || "");
      return { success: true };
    }
  }
  throw new Error("Encomenda não encontrada.");
}

function deleteOrder(id) {
  if (!id) throw new Error("ID em falta.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) { sh.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error("Encomenda não encontrada.");
}

function updateStatus(id, status, obs) {
  if (!id || !status) throw new Error("Parâmetros em falta.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const r      = i + 1;
      const oldSt  = rows[i][6];
      const code   = rows[i][1];
      sh.getRange(r, 7).setValue(status);
      sh.getRange(r, 9).setValue(new Date().toISOString());
      if (obs) sh.getRange(r, 10).setValue(obs);
      const hist = ss.getSheetByName(SHEET.HISTORY);
      hist.appendRow([id, code, oldSt, status, new Date().toISOString(), obs||""]);
      return { success: true };
    }
  }
  throw new Error("Encomenda não encontrada.");
}

// ══════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════
function getDashboard() {
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.ORDERS);
  const rows = sh.getDataRange().getValues();

  const stats = { total:0, transit:0, delivered:0, pending:0, cancelled:0, month:0, received:0, processing:0, customs:0, delivery:0 };
  const tz    = Session.getScriptTimeZone();
  const thisM = Utilities.formatDate(new Date(), tz, "yyyy-MM");
  const all   = [];

  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    const o = rowToOrder(rows[i]);
    all.push(o);
    stats.total++;
    if ((o.date||"").slice(0,7) === thisM) stats.month++;
    switch (o.status) {
      case "Recebida":          stats.received++;   stats.pending++; break;
      case "Em processamento":  stats.processing++; stats.pending++; break;
      case "Em trânsito":       stats.transit++;    break;
      case "Em alfândega":      stats.customs++;    break;
      case "Saiu para entrega": stats.delivery++;   break;
      case "Entregue":          stats.delivered++;  break;
      case "Cancelada":         stats.cancelled++;  break;
    }
  }

  const sorted = all.slice().sort((a,b) => (b.date||"").localeCompare(a.date||""));
  return { stats, recent: sorted.slice(0,8), allOrders: all };
}

// ══════════════════════════════════════════════════════════
//  UTILIZADORES
// ══════════════════════════════════════════════════════════
function getUsers() {
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    users.push({ id:String(rows[i][0]), name:String(rows[i][1]), username:String(rows[i][2]), role:String(rows[i][4]), created: rows[i][5] ? new Date(rows[i][5]).toISOString() : "" });
  }
  return { users };
}

function createUser(u) {
  if (!u.name || !u.username || !u.password) throw new Error("Campos obrigatórios em falta.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]) === String(u.username)) throw new Error("Username já existe.");
  }
  const id = Utilities.getUuid();
  sh.appendRow([id, u.name, u.username, u.password, u.role||"assistente", new Date().toISOString()]);
  return { success: true, id };
}

function updateUser(id, u) {
  if (!id) throw new Error("ID em falta.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) {
      const r = i + 1;
      sh.getRange(r, 2).setValue(u.name);
      sh.getRange(r, 3).setValue(u.username);
      if (u.password) sh.getRange(r, 4).setValue(u.password);
      sh.getRange(r, 5).setValue(u.role);
      return { success: true };
    }
  }
  throw new Error("Utilizador não encontrado.");
}

function deleteUser(id) {
  if (!id) throw new Error("ID em falta.");
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.USERS);
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(id)) { sh.deleteRow(i + 1); return { success: true }; }
  }
  throw new Error("Utilizador não encontrado.");
}

// ══════════════════════════════════════════════════════════
//  CONFIGURAÇÕES
// ══════════════════════════════════════════════════════════
function getSettings() {
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.SETTINGS);
  const rows = sh.getDataRange().getValues();
  const out  = {};
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) out[String(rows[i][0])] = String(rows[i][1]);
  }
  return { settings: out };
}

function saveSettingsAction(s) {
  const ss   = SpreadsheetApp.openById(SS_ID);
  const sh   = ss.getSheetByName(SHEET.SETTINGS);
  const rows = sh.getDataRange().getValues();
  Object.entries(s).forEach(([key, val]) => {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === key) { sh.getRange(i+1,2).setValue(val); found = true; break; }
    }
    if (!found) sh.appendRow([key, val]);
  });
  return { success: true };
}
