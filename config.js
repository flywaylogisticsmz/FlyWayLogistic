// ─────────────────────────────────────────────────────────────────────────────
// Fly Way Logistics — config.js
//
// Ficheiro de configuração central.
// Edite aqui as personalizações sem tocar no código principal (app.js).
//
// ATENÇÃO: Inclua este ficheiro no index.html ANTES do app.js:
//   <script src="config.js"></script>
//   <script src="app.js"></script>
// ─────────────────────────────────────────────────────────────────────────────

const FLY_CONFIG = {

  // ── EMPRESA ────────────────────────────────────────────────────────────────
  empresa: {
    nome:    'Fly Way Logistics',
    rota:    'Portugal → Moçambique',
    rodape:  '© 2025 Fly Way Logistics · Portugal → Moçambique · Todos os direitos reservados',
    website: '',          // ex: 'https://flyway.co.mz'  (deixar vazio se não tiver)
    email:   '',          // ex: 'geral@flyway.co.mz'
  },

  // ── AUTENTICAÇÃO ───────────────────────────────────────────────────────────
  auth: {
    // Senha padrão do painel Admin.
    // Depois do primeiro login, altere a senha nas Definições do painel.
    // Esta constante serve apenas de fallback se não existir senha no localStorage.
    senhaDefault: 'flyadmin123',
  },

  // ── GOOGLE SHEETS ──────────────────────────────────────────────────────────
  sheets: {
    // URL da Web App do Google Apps Script.
    // Pode ser deixado vazio e configurado no painel Admin sem editar código.
    // Se preenchido aqui, serve como URL fixo (útil em deployments estáticos).
    urlFixo: '',
    // ex: 'https://script.google.com/macros/s/AKfycb.../exec'
  },

  // ── PREFIXO DOS IDs DE RASTREAMENTO ────────────────────────────────────────
  tracking: {
    prefixo:   'FLY',    // ex: 'FLY' → FLY10001, FLY10002, ...
    digitoMin: 5,        // número mínimo de dígitos no sufixo numérico
  },

  // ── WHATSAPP ───────────────────────────────────────────────────────────────
  whatsapp: {
    // Número padrão de suporte (aparece no botão WhatsApp da navbar, se ativado)
    // Formato internacional sem espaços: '258841234567'
    suporte: '',
  },

  // ── ESTADOS DISPONÍVEIS ────────────────────────────────────────────────────
  // Altere a ordem ou os ícones conforme o seu fluxo operacional.
  // Não remova campos 'key' já existentes sem atualizar os dados do Sheets.
  estados: [
    { key: 'Em processamento',  icon: '📋', lbl: 'Em processamento' },
    { key: 'Recolhido',         icon: '🚚', lbl: 'Recolhido'        },
    { key: 'Em trânsito',       icon: '✈️', lbl: 'Em trânsito'      },
    { key: 'Em alfândega',      icon: '🛃', lbl: 'Em alfândega'     },
    { key: 'Chegou ao destino', icon: '📍', lbl: 'Chegado'          },
    { key: 'Saiu para entrega', icon: '🛵', lbl: 'Para entrega'     },
    { key: 'Entregue',          icon: '✅', lbl: 'Entregue'         },
  ],

  // ── DADOS DEMO (modo local / sem Sheets) ───────────────────────────────────
  // Encomendas de exemplo que aparecem quando não há Google Sheets configurado.
  // Defina 'mostrarDemo: false' para desativar completamente o modo demo.
  demo: {
    mostrarDemo: true,
    // Os dados demo estão definidos em app.js (função initDemo).
    // Para personalizar, edite initDemo() diretamente no app.js.
  },

  // ── LOCALIZAÇÃO ────────────────────────────────────────────────────────────
  locale: {
    idioma:   'pt-PT',   // usado em Date.toLocaleDateString / toLocaleTimeString
    moeda:    'MZN',     // (reservado para uso futuro)
    fuso:     'Africa/Maputo', // (reservado para uso futuro)
  },

};

// ── Exportar para uso global (compatibilidade com app.js sem módulos ES) ──────
// O app.js lê estas constantes se o ficheiro config.js for carregado primeiro.
// Exemplo de uso em app.js:  const prefixo = (window.FLY_CONFIG?.tracking?.prefixo) || 'FLY';
window.FLY_CONFIG = FLY_CONFIG;
