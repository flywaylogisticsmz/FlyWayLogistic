# Fly Way Logistic — Sistema de Rastreamento PT↔MZ

Sistema web de rastreamento e gestão de encomendas entre Portugal e Moçambique.

---

## 📁 Estrutura de Ficheiros

```
fly-way-logistic/
├── index.html          ← Aplicação completa (HTML + CSS + JS)
├── config.js           ← Configuração (edite aqui a API_URL)
├── backend/
│   └── Code.gs         ← Backend Google Apps Script
└── README.md
```

> **No GitHub:** faça upload de `index.html` e `config.js` na raiz do repositório.  
> **O `Code.gs`** vai separado para o Google Apps Script (não para o GitHub).

---

## 🚀 Instalação Passo a Passo

### PASSO 1 — Criar o Google Sheets

1. Aceda a [sheets.google.com](https://sheets.google.com)
2. Crie uma nova folha chamada **"Fly Way Logistic"**
3. Copie o **ID** do URL:
   ```
   https://docs.google.com/spreadsheets/d/  <<ESTE ID>>  /edit
   ```

---

### PASSO 2 — Configurar o Google Apps Script

1. Aceda a [script.google.com](https://script.google.com)
2. Clique em **"Novo projecto"**
3. Dê o nome **"Fly Way Logistic Backend"**
4. Apague todo o código e cole o conteúdo do ficheiro `backend/Code.gs`
5. Na linha `const SS_ID = "SEU_SPREADSHEET_ID_AQUI"` substitua pelo ID copiado no Passo 1
6. Guarde com **Ctrl+S**

---

### PASSO 3 — Inicializar a Base de Dados

No Google Apps Script:

1. No menu de funções, selecione **`setupSheets`** e clique **▶ Executar**
   - Autorize as permissões quando pedido
   - Aguarde: `✅ Folhas criadas com sucesso!`

2. Selecione **`createDefaultAdmin`** e clique **▶ Executar**
   - Aguarde: `✅ Admin criado — username: admin / password: admin123`

---

### PASSO 4 — Deploy do Backend

1. No Apps Script clique em **"Implementar" → "Nova implementação"**
2. Clique no ícone ⚙️ e selecione **"Aplicação Web"**
3. Configure:
   - **Descrição:** `v1.0`
   - **Executar como:** `Eu (o meu email)`
   - **Quem tem acesso:** `Qualquer pessoa` ← **OBRIGATÓRIO para funcionar**
4. Clique em **"Implementar"**
5. Autorize as permissões
6. **Copie a URL** (começa com `https://script.google.com/macros/s/...`)

---

### PASSO 5 — Configurar o Frontend

Abra o ficheiro `config.js` e substitua a URL:

```javascript
API_URL: "https://script.google.com/macros/s/COLE_AQUI_A_SUA_URL/exec",
```

---

### PASSO 6 — Publicar no GitHub Pages

1. Crie um repositório público em [github.com](https://github.com)
2. Faça upload de **`index.html`** e **`config.js`**
3. Aceda a **Settings → Pages**
4. Em **Source** selecione: `Deploy from a branch` → `main` → `/ (root)`
5. Clique **Save**
6. O sistema fica disponível em:
   ```
   https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO
   ```

---

## 🔑 Credenciais Iniciais

| Campo        | Valor      |
|--------------|------------|
| Username     | `admin`    |
| Password     | `admin123` |

> ⚠️ **Altere a palavra-passe após o primeiro login** em Utilizadores → Editar.

---

## 👥 Papéis de Acesso

| Funcionalidade           | Admin | Assistente |
|--------------------------|:-----:|:----------:|
| Ver encomendas           | ✅    | ✅         |
| Criar encomendas         | ✅    | ✅         |
| Atualizar estado         | ✅    | ✅         |
| Editar encomendas        | ✅    | ❌         |
| Eliminar encomendas      | ✅    | ❌         |
| Gerir utilizadores       | ✅    | ❌         |
| Ver relatórios           | ✅    | ❌         |
| Configurações do sistema | ✅    | ❌         |

---

## 📦 Estados das Encomendas

| Estado              | Descrição                       |
|---------------------|---------------------------------|
| Recebida            | Encomenda registada no sistema  |
| Em processamento    | A ser preparada para envio      |
| Em trânsito         | A caminho do destino            |
| Em alfândega        | Retida na alfândega             |
| Saiu para entrega   | Em entrega ao destinatário      |
| Entregue            | Entregue com sucesso            |
| Cancelada           | Encomenda cancelada             |

---

## 🔍 Rastreamento Público (sem login)

Os clientes podem rastrear as suas encomendas sem fazer login:

1. Aceda ao site
2. Clique em **"Rastrear a minha encomenda"**
3. Insira o código (ex: `FLY-Encomenda-202405121430`)

---

## ❗ Resolução de Problemas

**Erro "Failed to fetch" ou "Falha na ligação"**
- Verifique se a `API_URL` em `config.js` está correcta
- Confirme que o deploy foi feito com **"Quem tem acesso: Qualquer pessoa"**
- Após alterar o `Code.gs`, faça sempre uma **nova versão** do deploy:
  Apps Script → Implementar → Gerir implementações → ✏️ Editar → Nova versão

**O sistema não carrega no browser local (file://)**
- É normal — os browsers bloqueiam `fetch` em ficheiros locais
- Use sempre o GitHub Pages ou um servidor local:
  ```bash
  python -m http.server 8080
  # depois abra http://localhost:8080
  ```

**Após alterar o Code.gs preciso de novo deploy?**
- Sim. Sempre que alterar o backend:
  1. Apps Script → Implementar → Gerir implementações
  2. Clique no lápis ✏️ → Versão: **Nova versão** → Implementar

---

## 🛠️ Tecnologias

| Componente  | Tecnologia          |
|-------------|---------------------|
| Frontend    | HTML · CSS · JS     |
| Backend     | Google Apps Script  |
| Base dados  | Google Sheets       |
| Hospedagem  | GitHub Pages        |
| Rotas       | PT ↔ MZ             |
