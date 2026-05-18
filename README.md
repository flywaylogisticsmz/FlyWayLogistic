# Fly Way Logistics — Sistema de Rastreamento

Sistema de rastreamento de encomendas Portugal → Moçambique.  
Funciona 100% no browser — usa o Google Sheets como base de dados gratuita.

---

## Estrutura de Ficheiros

```
flyway-logistics/
├── index.html       — Interface do site (HTML + CSS)
├── app.js           — Lógica JavaScript (rastreamento, admin, Sheets)
├── config.js        — Configurações personalizáveis
├── appsscript.gs    — Código para o Google Apps Script (não vai para o GitHub)
├── CNAME            — Domínio personalizado para GitHub Pages
└── README.md        — Este ficheiro
```

---

## 🚀 Publicar no GitHub Pages

### Passo 1 — Criar conta e repositório no GitHub

1. Aceda a [github.com](https://github.com) e crie uma conta (se ainda não tiver)
2. Clique em **New repository** (botão verde)
3. Preencha:
   - **Repository name:** `flyway-logistics` *(ou outro nome curto)*
   - **Visibility:** `Public` ← obrigatório para GitHub Pages gratuito
4. Clique em **Create repository**

> 💡 **Dica para URL mais curto:** Se o nome do repositório for **igual** ao nome de utilizador do GitHub (ex: username = `flyway-mz`, repo = `flyway-mz`), o URL fica simplesmente `https://flyway-mz.github.io` sem sufixo extra.

---

### Passo 2 — Fazer upload dos ficheiros

**Pelo browser (mais simples):**

1. No repositório, clique em **uploading an existing file**
2. Arraste estes ficheiros de uma vez:
   - `index.html`
   - `app.js`
   - `config.js`
   - `CNAME` *(apenas se tiver domínio próprio — ver Passo 4)*
3. Em **Commit changes** escreva `Primeiro upload` e confirme

> ⚠️ O ficheiro `appsscript.gs` **não precisa de ir para o GitHub** — é colado directamente no editor do Google Apps Script.

**Pelo terminal (Git):**

```bash
git init
git remote add origin https://github.com/SEU-USERNAME/flyway-logistics.git
git add index.html app.js config.js CNAME
git commit -m "Primeiro upload"
git push -u origin main
```

---

### Passo 3 — Ativar o GitHub Pages

1. No repositório → **Settings** → **Pages** (menu lateral)
2. Em **Branch** selecione `main` e pasta `/ (root)`
3. Clique **Save**
4. Aguarde 1-2 minutos

O GitHub mostrará:
```
Your site is live at https://SEU-USERNAME.github.io/flyway-logistics/
```

---

### Passo 4 — Domínio personalizado (opcional mas recomendado)

Para ter `https://flyway.co.mz` em vez de `https://username.github.io/flyway-logistics/`:

#### 4a. Registar o domínio

Sugestões de domínio curto e profissional:

| Domínio | URL final |
|---|---|
| `flyway.co.mz` | `https://flyway.co.mz` |
| `fwlogistics.co.mz` | `https://fwlogistics.co.mz` |
| `flywaymz.com` | `https://flywaymz.com` |

Registar em [nic.mz](https://www.nic.mz) (registo oficial `.mz`) ou Namecheap/GoDaddy para `.com`.

#### 4b. Configurar os registos DNS

No painel do registrar, adicione:

**Registos A (para domínio raiz, ex: `flyway.co.mz`):**

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

**Registo CNAME (para www):**

| Tipo | Nome | Valor |
|---|---|---|
| CNAME | `www` | `SEU-USERNAME.github.io` |

#### 4c. Configurar no GitHub

1. Edite o ficheiro `CNAME` no repositório e coloque o seu domínio (ex: `flyway.co.mz`)
2. No repositório → **Settings → Pages → Custom domain** → escreva o domínio → **Save**
3. Ative **Enforce HTTPS** ✓

> ⏱ A propagação DNS demora normalmente menos de 1 hora (máximo 48h).

---

## ⚙️ Configurar o Google Sheets

### Passo 1 — Criar o Google Sheet

Aceda a [sheets.google.com](https://sheets.google.com) e crie uma folha nova. O script cria a aba **Encomendas** automaticamente.

### Passo 2 — Instalar o Apps Script

1. No Google Sheet → **Extensões → Apps Script**
2. Apague tudo e cole o conteúdo de `appsscript.gs`
3. **Guardar** (Ctrl + S)

### Passo 3 — Publicar como Web App

1. **Implementar → Nova implementação** → tipo: **Aplicação Web**
2. Configure:
   - **Executar como:** Eu mesmo
   - **Quem tem acesso:** `Qualquer pessoa` ← **OBRIGATÓRIO**
3. **Implementar** → autorize → copie o URL gerado

### Passo 4 — Ativar no painel Admin

1. Abra o site → **Admin** → senha padrão: `flyadmin123`
2. **Definições** → cole o URL do Apps Script → **Testar** → **Guardar e Ativar**
3. Copie o **Link de Partilha** e envie aos clientes

---

## 🔗 Resumo dos URLs após configuração completa

| O quê | URL |
|---|---|
| Site público (clientes rastreiam) | `https://flyway.co.mz` |
| Painel Admin | `https://flyway.co.mz` → botão **Admin** |
| Link partilhável (com Sheets embutido) | `https://flyway.co.mz?gs=https://script.google.com/...` |

---

## 🔄 Atualizar o site no futuro

**Pelo browser:**
1. No repositório GitHub, clique no ficheiro a editar
2. Ícone de lápis ✏️ → edite → **Commit changes**
3. O site atualiza em 1-2 minutos automaticamente

**Pelo terminal:**
```bash
git add .
git commit -m "Descrição da alteração"
git push
```

---

## Funcionalidades

### Para Clientes
- Introduzir código (ex: `FLY10001`) e ver o estado da encomenda em tempo real
- Visualização da rota Portugal → Moçambique
- Historial completo de eventos com datas e notas

### Para Administradores
| Função | Descrição |
|---|---|
| Listar encomendas | Tabela com pesquisa em tempo real |
| Nova encomenda | Formulário com ID gerado automaticamente |
| Atualizar estado | Adiciona nota ao historial + abre WhatsApp |
| Eliminar encomenda | Com confirmação modal |
| Notificação WhatsApp | Mensagem pré-formatada com um clique |
| Sincronizar | Recarrega dados do Google Sheets |
| Link partilhável | URL com Sheets incorporado para enviar a clientes |
| Alterar senha | Admin → Definições |

---

## Estados das Encomendas

| # | Estado | Ícone |
|---|---|---|
| 1 | Em processamento | 📋 |
| 2 | Recolhido | 🚚 |
| 3 | Em trânsito | ✈️ |
| 4 | Em alfândega | 🛃 |
| 5 | Chegou ao destino | 📍 |
| 6 | Saiu para entrega | 🛵 |
| 7 | Entregue | ✅ |

---

## Segurança

- Altere a senha padrão `flyadmin123` imediatamente após o primeiro login
- O GitHub Pages serve o site em HTTPS automaticamente (certificado gratuito via Let's Encrypt)
- Os dados do Google Sheets são protegidos pela conta Google do proprietário

---

## Resolução de Problemas

| Problema | Solução |
|---|---|
| Site não aparece após ativar Pages | Aguarde 2-5 min e force refresh (Ctrl+Shift+R) |
| Domínio personalizado não funciona | Verifique DNS e aguarde propagação (até 48h) |
| "Erro de ligação ao Sheets" | Confirme "Quem tem acesso" = **Qualquer pessoa** |
| Cliente não consegue rastrear | Envie o **Link de Partilha** (com `?gs=...`) e não o URL direto |
| Senha perdida | DevTools → Application → Local Storage → elimine a chave `fw_pass` |

---

*Fly Way Logistics — Portugal → Moçambique*
