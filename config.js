/**
 * ═══════════════════════════════════════════════
 *  FLY WAY LOGISTIC — CONFIGURAÇÃO DO SISTEMA
 *  Edite este ficheiro para configurar o sistema
 * ═══════════════════════════════════════════════
 */

const CONFIG = {

  /**
   * URL do Google Apps Script Web App
   * Após fazer o deploy, cole aqui a URL gerada
   * Exemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
   */
  API_URL: "https://script.google.com/macros/s/AKfycbwnDngdy9y0MYTzQcwHvzsfjK03mH9Fxf6XkztAvPWhyv7kK90GhkLLTfxNc3OhnaLu/exec",

  /** Nome do sistema */
  SYSTEM_NAME: "Fly Way Logistic",

  /** Rotas disponíveis */
  ROUTES: [
    "Portugal → Moçambique",
    "Moçambique → Portugal"
  ],

  /** Estados possíveis das encomendas (em ordem) */
  STATUSES: [
    "Recebida",
    "Em processamento",
    "Em trânsito",
    "Em alfândega",
    "Saiu para entrega",
    "Entregue",
    "Cancelada"
  ],

  /** Classes CSS para os badges de estado */
  STATUS_CLASS: {
    "Recebida":          "badge-received",
    "Em processamento":  "badge-processing",
    "Em trânsito":       "badge-transit",
    "Em alfândega":      "badge-customs",
    "Saiu para entrega": "badge-delivery",
    "Entregue":          "badge-delivered",
    "Cancelada":         "badge-cancelled"
  },

  /** Cores para o gráfico de barras no dashboard */
  STATUS_COLOR: {
    "Recebida":          "#9ca3af",
    "Em processamento":  "#eab308",
    "Em trânsito":       "#3b82f6",
    "Em alfândega":      "#a855f7",
    "Saiu para entrega": "#f88224",
    "Entregue":          "#22c55e",
    "Cancelada":         "#ef4444"
  },

  /** Ícones Font Awesome para cada estado */
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
