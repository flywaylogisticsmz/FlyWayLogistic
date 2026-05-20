// ─────────────────────────────────────────────────────────────────────────────
// Fly Way Logistics — Google Apps Script
// Versão corrigida: CORS + headers correctos + tratamento de erros robusto
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Encomendas';
const COLS = ['id','name','phone','product','origin','dest','weight','status','updatedAt','history'];

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLS);
    const hdr = sh.getRange(1, 1, 1, COLS.length);
    hdr.setFontWeight('bold');
    hdr.setBackground('#FF6A00');
    hdr.setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1,100); sh.setColumnWidth(2,180); sh.setColumnWidth(3,140);
    sh.setColumnWidth(4,200); sh.setColumnWidth(5,160); sh.setColumnWidth(6,160);
    sh.setColumnWidth(7,80);  sh.setColumnWidth(8,160); sh.setColumnWidth(9,140);
    sh.setColumnWidth(10,400);
  }
  return sh;
}

// ── Resposta JSON com headers CORS correctos ─────────────────────────────────
function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── GET: leitura e escrita via query params ───────────────────────────────────
function doGet(e) {
  try {
    const p  = e.parameter || {};
    const sh = getSheet();
    let result;

    // ── getAll ────────────────────────────────────────────────────────────────
    if (!p.action || p.action === 'getAll') {
      const rows = sh.getDataRange().getValues();
      if (rows.length <= 1) {
        result = { ok: true, orders: [] };
      } else {
        const orders = rows.slice(1).map(r => {
          const o = {};
          COLS.forEach((h, i) => { o[h] = r[i] !== undefined ? String(r[i]) : ''; });
          try { o.history = JSON.parse(o.history || '[]'); } catch(e2) { o.history = []; }
          return o;
        }).filter(o => o.id && o.id.trim() !== ''); // ignorar linhas vazias
        result = { ok: true, orders: orders };
      }

    // ── getOne ────────────────────────────────────────────────────────────────
    } else if (p.action === 'getOne') {
      const rows = sh.getDataRange().getValues();
      let found = null;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === String(p.id).trim()) {
          const o = {};
          COLS.forEach((h, j) => { o[h] = rows[i][j] !== undefined ? String(rows[i][j]) : ''; });
          try { o.history = JSON.parse(o.history || '[]'); } catch(e2) { o.history = []; }
          found = o;
          break;
        }
      }
      result = { ok: true, order: found };

    // ── create ────────────────────────────────────────────────────────────────
    } else if (p.action === 'create') {
      const raw = p.data ? decodeURIComponent(p.data) : '{}';
      const o   = JSON.parse(raw);
      sh.appendRow(COLS.map(h =>
        h === 'history' ? JSON.stringify(o[h] || []) : (o[h] || '')
      ));
      SpreadsheetApp.flush();
      result = { ok: true, action: 'created', id: o.id };

    // ── update ────────────────────────────────────────────────────────────────
    } else if (p.action === 'update') {
      const raw = p.data ? decodeURIComponent(p.data) : '{}';
      const o   = JSON.parse(raw);
      const rows = sh.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === String(o.id).trim()) {
          sh.getRange(i + 1, 1, 1, COLS.length).setValues([
            COLS.map(h => h === 'history' ? JSON.stringify(o[h] || []) : (o[h] || ''))
          ]);
          SpreadsheetApp.flush();
          updated = true;
          break;
        }
      }
      result = { ok: true, updated: updated };

    // ── delete ────────────────────────────────────────────────────────────────
    } else if (p.action === 'delete') {
      const rows = sh.getDataRange().getValues();
      let deleted = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === String(p.id).trim()) {
          sh.deleteRow(i + 1);
          SpreadsheetApp.flush();
          deleted = true;
          break;
        }
      }
      result = { ok: true, deleted: deleted };

    } else {
      result = { ok: false, error: 'Ação desconhecida: ' + p.action };
    }

    return jsonResponse(result);

  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString(), stack: err.stack });
  }
}

// ── POST: alternativa para evitar limitações de URL em alguns browsers ────────
function doPost(e) {
  try {
    const p  = e.parameter || {};
    const sh = getSheet();

    if (p.action === 'create' || p.action === 'update') {
      const body = e.postData ? JSON.parse(e.postData.contents) : {};
      const o    = body.data || {};

      if (p.action === 'create') {
        sh.appendRow(COLS.map(h =>
          h === 'history' ? JSON.stringify(o[h] || []) : (o[h] || '')
        ));
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true, action: 'created' });
      }

      if (p.action === 'update') {
        const rows = sh.getDataRange().getValues();
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === String(o.id).trim()) {
            sh.getRange(i + 1, 1, 1, COLS.length).setValues([
              COLS.map(h => h === 'history' ? JSON.stringify(o[h] || []) : (o[h] || ''))
            ]);
            SpreadsheetApp.flush();
            return jsonResponse({ ok: true, updated: true });
          }
        }
        return jsonResponse({ ok: true, updated: false });
      }
    }

    return jsonResponse({ ok: false, error: 'Ação não suportada via POST' });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

// ── Funções auxiliares (executar manualmente no editor) ───────────────────────
function clearAllOrders() {
  const sh = getSheet();
  const last = sh.getLastRow();
  if (last > 1) sh.deleteRows(2, last - 1);
  Logger.log('Todas as encomendas eliminadas.');
}

function exportJson() {
  const sh   = getSheet();
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) { Logger.log('[]'); return; }
  const orders = rows.slice(1).map(r => {
    const o = {};
    COLS.forEach((h, i) => o[h] = r[i]);
    try { o.history = JSON.parse(o.history || '[]'); } catch(e) { o.history = []; }
    return o;
  });
  Logger.log(JSON.stringify(orders, null, 2));
}

function testConnection() {
  const sh    = getSheet();
  const count = Math.max(0, sh.getLastRow() - 1);
  Logger.log('✅ Ligação OK — ' + count + ' encomenda(s) na folha "' + SHEET_NAME + '"');
}
