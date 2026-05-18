/**
 * ╔══════════════════════════════════════════╗
 *  FLY WAY LOGISTIC — CONFIGURAÇÃO
 *  Edite apenas este ficheiro para configurar
 * ╚══════════════════════════════════════════╝
 *
 * PASSO 1: Substitua a API_URL pela URL real
 *          gerada após o deploy do Apps Script.
 *
 * Exemplo:
 * "https://script.google.com/macros/s/AKfycbxXXXXX/exec"
 */

const CONFIG = {

  /* ── URL DO BACKEND (Apps Script) ─────────────────── */
  API_URL: "https://script.google.com/macros/s/AKfycbwExgwEgmNyevCQrz2-boGRboo4tWfoIswegf6SSYu72AqS_M6oqq_HvkDMaz-QiGYb/exec",

  /* ── NOME DO SISTEMA ──────────────────────────────── */
  SYSTEM_NAME: "Fly Way Logistic",

  /* ── ROTAS DISPONÍVEIS ────────────────────────────── */
  ROUTES: [
    "Portugal → Moçambique",
    "Moçambique → Portugal"
  ],

  /* ── ESTADOS DAS ENCOMENDAS (por ordem) ──────────── */
  STATUSES: [
    "Recebida",
    "Em processamento",
    "Em trânsito",
    "Em alfândega",
    "Saiu para entrega",
    "Entregue",
    "Cancelada"
  ],

  /* ── CLASSES CSS DOS BADGES ───────────────────────── */
  STATUS_CLASS: {
    "Recebida":          "badge-received",
    "Em processamento":  "badge-processing",
    "Em trânsito":       "badge-transit",
    "Em alfândega":      "badge-customs",
    "Saiu para entrega": "badge-delivery",
    "Entregue":          "badge-delivered",
    "Cancelada":         "badge-cancelled"
  },

  /* ── CORES DO GRÁFICO ─────────────────────────────── */
  STATUS_COLOR: {
    "Recebida":          "#9ca3af",
    "Em processamento":  "#eab308",
    "Em trânsito":       "#3b82f6",
    "Em alfândega":      "#a855f7",
    "Saiu para entrega": "#f88224",
    "Entregue":          "#22c55e",
    "Cancelada":         "#ef4444"
  },

  /* ── ÍCONES FONT AWESOME ──────────────────────────── */
  STATUS_ICON: {
    "Recebida":          "fa-inbox",
    "Em processamento":  "fa-gears",
    "Em trânsito":       "fa-plane",
    "Em alfândega":      "fa-building-columns",
    "Saiu para entrega": "fa-truck",
    "Entregue":          "fa-circle-check",
    "Cancelada":         "fa-ban"
  }

};
