# CondomínioVoz — Especificação do MVP

## Visão Geral
Plataforma web (mobile-first) de governança participativa para condomínios.
Moradores registram demandas, apoiam as de outros moradores, e votam em pautas.
O síndico visualiza um ranking de prioridades e simula alocação de orçamento.
O sistema gera relatórios automáticos para assembleias.

## Público-alvo
- Moradores de condomínios residenciais (20-200 unidades)
- Síndicos profissionais e moradores-síndicos
- MVP inicial: 1 condomínio com ~50 unidades em São Paulo

## Stack Técnica
- Frontend: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- Backend: Next.js API Routes + Server Actions
- Banco de dados: Supabase (PostgreSQL) + Supabase Auth
- Deploy: Vercel
- Ícones: lucide-react
- Gráficos: recharts
- Datas: date-fns

## Estrutura de Páginas

### Páginas Públicas
- `/login` — Login por email/senha + cadastro de novo morador

### Páginas do Morador (autenticado, role = 'morador')
- `/` — Feed de demandas (ordenadas por apoios) + botão "Nova Demanda"
- `/demanda/[id]` — Detalhe da demanda com comentários
- `/votacoes` — Lista de votações abertas e encerradas
- `/votacao/[id]` — Detalhe da votação com opção de votar

### Páginas do Síndico (autenticado, role = 'sindico')
- `/dashboard` — Painel com métricas, gráficos, ranking
- `/dashboard/orcamento` — Simulador de alocação de orçamento
- `/dashboard/votacoes` — Gerenciar votações (criar/encerrar)
- `/dashboard/relatorio` — Gerar relatório PDF para assembleia
- `/dashboard/moradores` — Lista de moradores cadastrados

## Features Detalhadas

### F1: Autenticação
- Cadastro: email, senha, nome, número do apartamento
- Login: email + senha
- Roles: 'morador' ou 'sindico' (definido no campo role da tabela profiles)
- Proteção de rotas: moradores não acessam /dashboard, síndicos acessam tudo
- Magic link como alternativa (opcional)

### F2: Portal de Demandas
- Morador cria demanda com: título (max 100 chars), descrição (max 500 chars), categoria, foto (upload opcional para Supabase Storage)
- Categorias fixas: Manutenção, Segurança, Lazer, Estética, Estrutural, Outro
- Status da demanda: aberta, em_votacao, aprovada, em_andamento, concluida, rejeitada
- Cada demanda mostra: título, categoria (com ícone colorido), nº apoios, autor, data, status
- Ordenação padrão: por número de apoios (decrescente)
- Filtros: por categoria, por status

### F3: Sistema de Apoio (Upvote)
- Morador clica em "Apoiar" em uma demanda
- Cada morador pode apoiar cada demanda apenas UMA vez
- Pode remover o apoio (toggle)
- Contagem de apoios atualiza em tempo real (ou on refresh)
- Não é voto formal, é sinalização de interesse

### F4: Sistema de Votação por Pauta
- APENAS o síndico pode criar uma votação
- Criação: título, descrição, opções (padrão: Sim/Não/Abstenção), prazo (data/hora de encerramento), orçamento estimado (opcional), pode vincular a uma ou mais demandas
- Cada unidade (apartamento) tem direito a 1 voto por votação
- Morador vota em uma das opções
- Resultado parcial: configurável (visível ou oculto até encerramento)
- Ao encerrar: resultado final com percentuais, quórum atingido (>50% das unidades votaram)
- Votação pode ser encerrada manualmente pelo síndico ou automaticamente no prazo

### F5: Dashboard do Síndico
- Card: Total de demandas abertas
- Card: Total de moradores cadastrados
- Card: Votações ativas
- Card: Índice de participação (% moradores que votaram na última votação)
- Gráfico de barras: Top 10 demandas por apoios
- Gráfico pizza: Distribuição de demandas por categoria
- Indicador de "Saúde do Condomínio": score 0-100 baseado em volume de demandas resolvidas vs abertas

### F6: Simulador de Orçamento
- Síndico insere: orçamento total disponível (R$)
- Sistema mostra as demandas aprovadas/priorizadas
- Para cada demanda, síndico pode inserir custo estimado
- Sistema sugere alocação ótima (prioriza por apoios/votos e custo)
- Síndico pode ajustar manualmente (drag ou input)
- Barra de progresso: quanto do orçamento foi alocado
- Alerta se ultrapassar o orçamento

### F7: Relatório para Assembleia
- Gerar PDF com:
  - Resumo do período (demandas criadas, resolvidas, votações realizadas)
  - Ranking das top demandas por apoio
  - Resultados das votações (com percentuais)
  - Proposta de alocação de orçamento
  - Índice de participação dos moradores
  - Gráficos (barras e pizza)
- Download como PDF
- Opção de visualizar antes de baixar

## Design & UX

### Princípios
- Mobile-first (maioria dos moradores vai usar no celular)
- Limpo, moderno, sem poluição visual
- Cores: azul-marinho como primária (#1e3a5f), verde-menta como secundária (#10b981), fundo claro (#f8fafc)
- Fonte: sistema (sem precisar carregar fonte externa)
- Ícones do lucide-react para cada categoria e ação
- Feedback visual imediato em todas as ações (loading states, toasts)
- Sem scroll infinito — paginação simples

### Padrão de Componentes
- Todos os componentes em src/components/
- Layout compartilhado com navegação inferior (mobile) ou lateral (desktop)
- Navbar mostra: logo + nome do condomínio + avatar do usuário
- Navegação mobile (bottom bar): Home (demandas) | Votações | Perfil
- Navegação síndico: adiciona aba "Dashboard"

## Regras de Negócio
- Um morador pertence a exatamente 1 condomínio
- Um apartamento pode ter múltiplos moradores, mas na votação vale 1 voto por unidade
- O primeiro morador de uma unidade a votar define o voto daquela unidade
- Síndico também é morador e pode apoiar/votar
- Demandas só podem ser editadas pelo autor e apenas enquanto status = 'aberta'
- Votações não podem ser editadas após criação (apenas encerradas)

## Segurança (Supabase RLS)
- Moradores só veem dados do próprio condomínio
- Apenas síndicos podem criar votações e acessar dashboard
- Apoios e votos são imutáveis após inserção (exceto remoção de apoio)
- Upload de fotos limitado a 5MB, apenas imagens (jpg, png, webp)

## Ordem de Implementação Sugerida
1. Auth + tabelas no Supabase + layout base
2. CRUD de demandas + listagem + categorias
3. Sistema de apoio (upvote/toggle)
4. Sistema de votação (criação + votação + resultado)
5. Dashboard do síndico (cards + gráficos)
6. Simulador de orçamento
7. Relatório PDF
8. Polish: responsividade, loading states, error handling
9. Deploy no Vercel