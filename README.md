# Fly Way Logistic — Sistema de Rastreamento PT↔MZ

> Sistema web de rastreamento e gestão de encomendas entre Portugal e Moçambique.

---

## 🗂️ Estrutura do Projeto

```
fly-way-logistic/
├── index.html              # Página principal (login + app)
├── css/
│   └── style.css           # Estilos do sistema
├── js/
│   ├── config.js           # Configurações (URL do backend, etc.)
│   ├── api.js              # Camada de comunicação com o backend
│   └── app.js              # Lógica da aplicação
├── backend/
│   └── Code.gs             # Código do Google Apps Script
└── README.md               # Este ficheiro
```

---

## 🚀 Guia de Instalação Completo

### PASSO 1 — Criar o Google Sheets

1. Aceda a [sheets.google.com](https://sheets.google.com)
2. Crie uma nova folha de cálculo
3. Dê o nome **"Fly Way Logistic — Base de Dados"**
4. Copie o **ID** da folha do URL:
   - URL: `https://docs.google.com/spreadsheets/d/`**`1BxiMVs0XRA5...`**`/edit`
   - O ID é a parte em negrito

---

### PASSO 2 — Configurar o Google Apps Script

1. Aceda a [script.google.com](https://script.google.com)
2. Clique em **"Novo projeto"**
3. Apague o código existente
4. Cole todo o conteúdo do ficheiro `backend/Code.gs`
5. Na linha `const SS_ID = "SEU_SPREADSHEET_ID_AQUI"`, substitua pelo ID copiado no Passo 1
6. Salve o projeto (Ctrl+S) com o nome **"Fly Way Logistic Backend"**

---

### PASSO 3 — Inicializar a Base de Dados

No Google Apps Script:

1. No menu superior, selecione a função `setupSheets`
2. Clique em **▶ Executar**
3. Autorize as permissões quando pedido
4. Aguarde a mensagem `✅ Folhas criadas com sucesso!`

Depois:

1. Selecione a função `createDefaultAdmin`
2. Clique em **▶ Executar**
3. Aguarde `✅ Admin criado: username=admin / password=admin123`

---

### PASSO 4 — Fazer o Deploy do Backend

1. No Apps Script, clique em **Implementar > Nova implementação**
2. Clique no ícone ⚙️ ao lado de "Tipo" e selecione **"Aplicação Web"**
3. Configure:
   - **Descrição**: `Fly Way Logistic v1.0`
   - **Executar como**: `Eu (seu email)`
   - **Quem tem acesso**: `Qualquer pessoa`
4. Clique em **Implementar**
5. Autorize as permissões
6. **Copie a URL** gerada (começa com `https://script.google.com/macros/s/...`)

---

### PASSO 5 — Configurar o Frontend

1. Abra o ficheiro `js/config.js`
2. Na linha `API_URL:`, cole a URL copiada no Passo 4:
   ```javascript
   API_URL: "https://script.google.com/macros/s/AKfycbx.../exec",
   ```
3. Salve o ficheiro

---

### PASSO 6 — Hospedar no GitHub Pages

1. Crie uma conta em [github.com](https://github.com) (se não tiver)
2. Crie um novo repositório público com o nome `fly-way-logistic`
3. Faça upload de todos os ficheiros do projeto (exceto a pasta `backend/`)
4. Aceda a **Settings > Pages**
5. Em **Source**, selecione `main` branch e pasta `/root`
6. Clique em **Save**
7. O site ficará disponível em: `https://SEU_USUARIO.github.io/fly-way-logistic`

---

## 🔐 Credenciais Iniciais

| Campo      | Valor    |
|------------|----------|
| Username   | `admin`  |
| Password   | `admin123` |

> ⚠️ **IMPORTANTE**: Altere a palavra-passe após o primeiro login em Utilizadores > Editar.

---

## 👥 Papéis de Acesso

| Funcionalidade              | Admin | Assistente |
|-----------------------------|-------|------------|
| Ver encomendas              | ✅    | ✅         |
| Criar encomendas            | ✅    | ✅         |
| Atualizar estado            | ✅    | ✅         |
| Editar encomendas           | ✅    | ❌         |
| Eliminar encomendas         | ✅    | ❌         |
| Gerir utilizadores          | ✅    | ❌         |
| Ver relatórios              | ✅    | ❌         |
| Configurações do sistema    | ✅    | ❌         |

---

## 📦 Estados das Encomendas

| Estado              | Descrição                        |
|---------------------|----------------------------------|
| Recebida            | Encomenda registada no sistema   |
| Em processamento    | A ser preparada para envio       |
| Em trânsito         | A caminho do destino             |
| Em alfândega        | Retida na alfândega              |
| Saiu para entrega   | Em entrega ao destinatário       |
| Entregue            | Entregue com sucesso             |
| Cancelada           | Encomenda cancelada              |

---

## 🔍 Rastreamento Público

Os clientes podem rastrear as suas encomendas sem login em:
```
https://SEU_USUARIO.github.io/fly-way-logistic
```
Clicando em **"Rastrear a minha encomenda"** e introduzindo o código (ex: `FLY-Encomenda-202405121430`).

---

## 🔄 Atualizar o Backend

Após qualquer alteração ao `Code.gs`:
1. Apps Script > Implementar > Gerir implementações
2. Clique no lápis ✏️
3. Em Versão, selecione **"Nova versão"**
4. Clique em **Implementar**

---

## 📞 Suporte

Sistema desenvolvido para gestão de encomendas PT↔MZ.  
Tecnologias: HTML · CSS · JavaScript · Google Sheets · Google Apps Script · GitHub Pages
