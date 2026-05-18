// ─────────────────────────────────────────────────────────────────────────────
// Fly Way Logistics — Google Apps Script
// Ficheiro: appsscript.gs
//
// INSTRUÇÕES:
//  1. Abra o Google Sheet → Extensões → Apps Script
//  2. Apague tudo e cole este código
//  3. Clique em Guardar (Ctrl + S)
//  4. Implementar → Nova implementação → tipo: Aplicação Web
//     • Executar como: Eu mesmo
//     • Quem tem acesso: Qualquer pessoa   ← OBRIGATÓRIO
//  5. Clique em Implementar → autorize → copie o URL gerado
//  6. Cole o URL no painel Admin → Definições do site
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Encomendas';
const COLS = ['id', 'name', 'phone', 'product', 'origin', 'dest', 'weight', 'status', 'updatedAt', 'history'];

// ── Obter (ou criar) a folha ─────────────────────────────────────────────────
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(COLS);

    // Formatação do cabeçalho
    const hdr = sh.getRange(1, 1, 1, COLS.length);
    hdr.setFontWeight('bold');
    hdr.setBackground('#FF6A00');
    hdr.setFontColor('#FFFFFF');
    sh.setFrozenRows(1);

    // Larguras de colunas
    sh.setColumnWidth(1, 100);  // id
    sh.setColumnWidth(2, 180);  // name
    sh.setColumnWidth(3, 140);  // phone
    sh.setColumnWidth(4, 200);  // product
    sh.setColumnWidth(5, 160);  // origin
    sh.setColumnWidth(6, 160);  // dest
    sh.setColumnWidth(7, 80);   // weight
    sh.setColumnWidth(8, 160);  // status
    sh.setColumnWidth(9, 140);  // updatedAt
    sh.setColumnWidth(10, 400); // history (JSON)
  }
  return sh;
}

// ── Ponto de entrada HTTP GET ────────────────────────────────────────────────
function doGet(e) {
  // Cabeçalhos CORS para permitir pedidos do browser
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  const p  = e.parameter;
  const sh = getSheet();
  let result;

  try {
    // ── getAll: devolve todas as encomendas ───────────────────────────────
    if (p.action === 'getAll') {
      const rows = sh.getDataRange().getValues();
      if (rows.length <= 1) {
        result = { ok: true, orders: [] };
      } else {
        const orders = rows.slice(1).map(r => {
          const o = {};
          COLS.forEach((h, i) => o[h] = r[i]);
          try { o.history = JSON.parse(o.history || '[]'); }
          catch (e2) { o.history = []; }
          return o;
        });
        result = { ok: true, orders };
      }

    // ── create: adiciona nova encomenda ───────────────────────────────────
    } else if (p.action === 'create') {
      const o = JSON.parse(decodeURIComponent(p.data));
      sh.appendRow(COLS.map(h =>
        h === 'history' ? JSON.stringify(o[h] || []) : (o[h] || '')
      ));
      result = { ok: true };

    // ── update: actualiza encomenda existente (por ID) ────────────────────
    } else if (p.action === 'update') {
      const o    = JSON.parse(decodeURIComponent(p.data));
      const vals = sh.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < vals.length; i++) {
        if (vals[i][0] === o.id) {
          sh.getRange(i + 1, 1, 1, COLS.length).setValues([
            COLS.map(h => h === 'history' ? JSON.stringify(o[h] || []) : (o[h] || ''))
          ]);
          updated = true;
          break;
        }
      }
      result = { ok: true, updated };

    // ── delete: elimina encomenda por ID ──────────────────────────────────
    } else if (p.action === 'delete') {
      const vals = sh.getDataRange().getValues();
      let deleted = false;
      for (let i = 1; i < vals.length; i++) {
        if (vals[i][0] === p.id) {
          sh.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      result = { ok: true, deleted };

    // ── getOne: pesquisa encomenda por ID (opcional) ──────────────────────
    } else if (p.action === 'getOne') {
      const vals = sh.getDataRange().getValues();
      let found  = null;
      for (let i = 1; i < vals.length; i++) {
        if (vals[i][0] === p.id) {
          const o = {};
          COLS.forEach((h, j) => o[h] = vals[i][j]);
          try { o.history = JSON.parse(o.history || '[]'); }
          catch (e2) { o.history = []; }
          found = o;
          break;
        }
      }
      result = { ok: true, order: found };

    } else {
      result = { ok: false, error: 'Ação desconhecida: ' + (p.action || '(vazia)') };
    }

  } catch (err) {
    result = { ok: false, error: err.toString() };
  }

  output.setContent(JSON.stringify(result));
  return output;
}

// ── Função auxiliar: limpar dados de teste (executar manualmente) ────────────
function clearAllOrders() {
  const sh   = getSheet();
  const last = sh.getLastRow();
  if (last > 1) sh.deleteRows(2, last - 1);
  Logger.log('Todas as encomendas eliminadas.');
}

// ── Função auxiliar: exportar JSON (executar manualmente) ────────────────────
function exportJson() {
  const sh   = getSheet();
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) { Logger.log('[]'); return; }
  const orders = rows.slice(1).map(r => {
    const o = {};
    COLS.forEach((h, i) => o[h] = r[i]);
    try { o.history = JSON.parse(o.history || '[]'); } catch (e) { o.history = []; }
    return o;
  });
  Logger.log(JSON.stringify(orders, null, 2));
}
