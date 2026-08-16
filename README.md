# CoopVia — Gestão de Transporte Corporativo (Cooperativa)

Sistema white-label para cooperativa que faz transporte de funcionários de
empresas (públicas e privadas), com veículos de até 7 passageiros.

Modelo: **Empresa contratante → Cooperativa → Motorista → Funcionários.**
O funcionário **não** instala app — é só cadastrado pela empresa.

---

## Acessos demo (senha: `123`)

| Perfil        | Usuário      | Onde cai          |
|---------------|--------------|-------------------|
| Administrador | `admin`      | Painel cooperativa |
| Operador      | `operador`   | Painel cooperativa |
| Financeiro    | `financeiro` | Fechamento/recibo  |
| Empresa ACELEN| `acelen`     | Portal da empresa  |
| Empresa Braskem| `braskem`   | Portal da empresa  |
| Motorista     | `ticiana`    | App do motorista   |
| Motorista     | `carlos`     | App do motorista   |

Botão **↻ Demo** (no admin) recarrega os dados de demonstração.

---

## Publicar no GitHub Pages

1. Crie um repositório novo (ex.: **`Coop-Corporativa`**).
2. Arraste **todos** os arquivos desta pasta para o repositório —
   inclusive o arquivo **`.nojekyll`** (sem ele o GitHub Pages quebra).
3. Em **Settings → Pages**, selecione a branch `main` / pasta `/root` e salve.
4. Acesse `https://22interliga.github.io/Coop-Corporativa/` (ajuste o nome do repo).
   A raiz abre o `index.html`, que redireciona para o login se não houver sessão.

> Dica: para o app abrir direto no login, você pode acessar
> `.../Coop-Corporativa/login.html`.

---

## Arquivos

| Arquivo         | O que é |
|-----------------|---------|
| `login.html`    | Entrada única, redireciona por perfil |
| `index.html`    | Painel da cooperativa (admin/operador/financeiro) |
| `empresa.html`  | Portal da empresa contratante (só os dados dela) |
| `motorista.html`| App do motorista (botões grandes) |
| `db.js`         | Modelo de dados + seed + **motor de cálculo** |
| `geo.js`        | KM real via **Nominatim + OSRM** (grátis) |
| `ui.js`         | Toast, modal, helpers |
| `styles.css`    | Estilo compartilhado |
| `manifest.json` / `sw.js` | PWA (instalável, offline) |
| `.nojekyll`     | Obrigatório no GitHub Pages |

---

## Cálculo de KM (OSRM) — importante

O botão **🗺️ Calcular pelo mapa** no cadastro de roteiro usa servidores
públicos **de demonstração** (`nominatim.openstreetmap.org` + `router.project-osrm.org`).
Eles têm limite de uso (Nominatim: 1 consulta/segundo) e **não servem para
produção em volume**.

Para escalar: suba um **OSRM próprio** (Docker) e/ou um Nominatim próprio e
troque só as URLs em **`geo.js → Geo.CFG`**. O resto do sistema não muda.

---

## Próximas fases (não incluídas no v1)

- Firebase Firestore no lugar do localStorage (multiusuário real)
- Notificações via WhatsApp (documentos vencendo, ocorrências)
- Contratos + manutenção com alertas de vencimento
- Mapa operacional em tempo real
- Rota de volta calculada separada da ida (hoje: ida × 2)
- Relatórios PDF/Excel/CSV

---

_CoopVia — parte do ecossistema Interliga / 22 Mobilidade._
