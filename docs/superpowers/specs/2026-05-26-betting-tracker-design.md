# Betting Tracker — Design Spec

**Data:** 2026-05-26  
**Status:** Aprovado pelo usuário

---

## 1. Visão Geral

Aplicação web para registrar e acompanhar apostas esportivas feitas simultaneamente em duas casas de apostas: **BR4** e **Stake**. O usuário aposta em lados opostos do mesmo evento (arbitragem), garantindo sempre um lado vencedor. O objetivo da ferramenta é rastrear quanto foi investido e quanto saiu em cada casa, calcular o resultado líquido por dia e exibir um resumo acumulado com filtro por período.

**Usuários:** 2 pessoas (sem autenticação — acesso aberto).  
**Frequência:** Uso diário.

---

## 2. Stack Tecnológica

| Camada      | Tecnologia             |
|-------------|------------------------|
| Frontend    | Next.js 14 (App Router) + TypeScript |
| Estilização | Tailwind CSS           |
| Banco       | Supabase (PostgreSQL)  |
| Deploy      | Vercel (free tier)     |

**Justificativa:** Next.js + Supabase é o equilíbrio ideal entre produtividade e robustez para um projeto pequeno com dados persistidos online. Deploy na Vercel é automático a partir do repositório GitHub.

---

## 3. Modelo de Dados

### Tabela: `entries`

| Coluna        | Tipo        | Descrição                              |
|---------------|-------------|----------------------------------------|
| `id`          | uuid (PK)   | Gerado automaticamente                 |
| `date`        | date        | Data da aposta (única por dia, UNIQUE) |
| `br4_in`      | numeric(10,2) | Valor apostado na BR4               |
| `br4_out`     | numeric(10,2) | Valor recebido de volta da BR4      |
| `stake_in`    | numeric(10,2) | Valor apostado na Stake             |
| `stake_out`   | numeric(10,2) | Valor recebido de volta da Stake    |
| `created_at`  | timestamptz | Preenchido automaticamente             |

**Campos calculados (não armazenados, computados na query/frontend):**
- `br4_result` = `br4_out - br4_in`
- `stake_result` = `stake_out - stake_in`
- `day_result` = `(br4_out + stake_out) - (br4_in + stake_in)`

---

## 4. Funcionalidades

### 4.1 Dashboard (página principal `/`)

**Filtro de período:**
- Dois inputs de data: "De" e "Até"
- Botão "Filtrar" aplica o período
- Botão "Tudo" remove o filtro e mostra todos os registros
- **Padrão ao abrir:** sem filtro aplicado (mostra tudo)
- Estado do filtro mantido na URL (query params) para poder compartilhar

**Cards de resumo** (calculados sobre o período filtrado):
1. **Resultado Líquido** — soma de `day_result` de todos os dias → exibido em verde (positivo) ou vermelho (negativo)
2. **BR4** — soma de `br4_result` + total investido e total saído
3. **Stake** — soma de `stake_result` + total investido e total saído

**Tabela de histórico:**
- Colunas: Data | BR4 (entrou → saiu) | Stake (entrou → saiu) | Resultado do dia
- Ordenada por data decrescente (mais recente primeiro)
- Resultado do dia em verde (positivo), vermelho (negativo) ou cinza (zero)
- Cada linha tem botão de editar e deletar

**Botão "Novo dia":**
- Abre modal de criação

### 4.2 Modal de Entrada (criar / editar)

**Campos:**
- Data (date picker, padrão = hoje)
- BR4: "Quanto entrou" + "Quanto saiu"
- Stake: "Quanto entrou" + "Quanto saiu"

**Preview automático:**
- Enquanto o usuário preenche, mostra em tempo real o resultado calculado (BR4, Stake e NET)

**Validações:**
- Todos os 4 campos de valor são obrigatórios
- Valores devem ser ≥ 0
- Não pode haver dois registros para a mesma data (constraint no banco + validação no frontend)

**Ações:** Salvar | Cancelar  
**Edição:** mesmo modal, pré-preenchido com os dados existentes

### 4.3 Deletar entrada
- Botão de delete na linha da tabela
- Confirmação simples ("Tem certeza?") antes de deletar

---

## 5. Design Visual

- **Tema:** Dark mode (fundo `#0d0d0d`, cards com bordas sutis)
- **Cores de destaque:**
  - Verde `#4ade80` para lucro / positivo
  - Vermelho `#f87171` para prejuízo / negativo
  - Azul `#60a5fa` para BR4
  - Roxo `#a78bfa` para Stake
- **Layout:** Single page, responsivo (funciona em mobile e desktop)
- **Tipografia:** Sistema sans-serif padrão do Tailwind

---

## 6. Arquitetura da Aplicação

```
/app
  page.tsx              ← Dashboard (página principal)
  layout.tsx            ← Layout root com tema dark
/components
  SummaryCards.tsx      ← 3 cards de resumo
  PeriodFilter.tsx      ← Filtro de datas
  EntriesTable.tsx      ← Tabela de histórico
  EntryModal.tsx        ← Modal criar/editar
  DeleteConfirm.tsx     ← Confirmação de exclusão
/lib
  supabase.ts           ← Client Supabase
  calculations.ts       ← Funções de cálculo (br4_result, stake_result, day_result, totals)
/types
  index.ts              ← Tipos TypeScript (Entry, Summary, etc.)
```

**Fluxo de dados:**
1. `page.tsx` busca entries do Supabase via Server Component (ou Client com SWR)
2. Passa para `SummaryCards` e `EntriesTable` como props
3. `PeriodFilter` atualiza query params na URL → re-fetch
4. `EntryModal` faz insert/update direto no Supabase Client e invalida o cache

---

## 7. Banco de Dados — Setup Supabase

SQL de criação da tabela:

```sql
create table entries (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  br4_in numeric(10,2) not null check (br4_in >= 0),
  br4_out numeric(10,2) not null check (br4_out >= 0),
  stake_in numeric(10,2) not null check (stake_in >= 0),
  stake_out numeric(10,2) not null check (stake_out >= 0),
  created_at timestamptz default now()
);
```

**Row Level Security:** desabilitado (sem autenticação, acesso público via `anon key`).

---

## 8. Deploy

1. Código no GitHub (repositório público ou privado)
2. Vercel conecta ao repositório → deploy automático
3. Variáveis de ambiente na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. URL final: `betting-tracker.vercel.app` (ou domínio customizado)

---

## 9. Fora de Escopo

- Autenticação / login
- Múltiplos usuários com dados separados
- Gráficos / charts
- Notificações ou alertas
- Histórico de quem fez cada registro
- Mobile app nativo
