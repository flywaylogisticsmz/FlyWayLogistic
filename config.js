/**
 * ═══════════════════════════════════════════
 *  FLY WAY LOGISTIC — CONFIGURAÇÃO
 *  Edite este ficheiro com os seus dados reais
 * ═══════════════════════════════════════════
 */

const CONFIG = {
  /**
   * URL do Google Apps Script Web App
   * Após fazer deploy do Apps Script, cole aqui a URL
   * Exemplo: "https://script.google.com/macros/s/AKfycbx.../exec"
   */
  API_URL: "https://script.google.com/macros/s/AKfycbwnDngdy9y0MYTzQcwHvzsfjK03mH9Fxf6XkztAvPWhyv7kK90GhkLLTfxNc3OhnaLu/exec",

  /**
   * Nome do sistema (aparece no título e emails)
   */
  SYSTEM_NAME: "Fly Way Logistic",

  /**
   * Rotas suportadas
   */
  ROUTES: [
    "Portugal → Moçambique",
    "Moçambique → Portugal"
  ],

  /**
   * Estados da encomenda (em ordem)
   */
  STATUSES: [
    "Recebida",
    "Em processamento",
    "Em trânsito",
    "Em alfândega",
    "Saiu para entrega",
    "Entregue",
    "Cancelada"
  ],

  /**
   * Mapeamento de estados para classes CSS de badge
   */
  STATUS_CLASS: {
    "Recebida": "badge-received",
    "Em processamento": "badge-processing",
    "Em trânsito": "badge-transit",
    "Em alfândega": "badge-customs",
    "Saiu para entrega": "badge-delivery",
    "Entregue": "badge-delivered",
    "Cancelada": "badge-cancelled"
  },

  /**
   * Cores das barras no gráfico de estados
   */
  STATUS_COLOR: {
    "Recebida": "#9ca3af",
    "Em processamento": "#eab308",
    "Em trânsito": "#3b82f6",
    "Em alfândega": "#a855f7",
    "Saiu para entrega": "#f88224",
    "Entregue": "#22c55e",
    "Cancelada": "#ef4444"
  },

  /**
   * Ícones dos estados da timeline
   */
  STATUS_ICON: {
    "Recebida": "fa-inbox",
    "Em processamento": "fa-gears",
    "Em trânsito": "fa-plane",
    "Em alfândega": "fa-building-columns",
    "Saiu para entrega": "fa-truck",
    "Entregue": "fa-circle-check",
    "Cancelada": "fa-ban"
  }
};
