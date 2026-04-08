@AGENTS.md

# CondomínioVoz - Instruções do Projeto

## Stack
- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- lucide-react para ícones, recharts para gráficos, date-fns para datas
- Deploy: Vercel

## Regras de Código
- Sempre em português brasileiro (variáveis podem ser em inglês, UI em português)
- Mobile-first: tudo deve funcionar bem em 375px
- Cores: primária #1e3a5f, secundária #10b981, fundo #f8fafc
- Usar Server Components quando possível, Client Components só quando necessário
- Supabase client em src/lib/supabase/client.ts e server em src/lib/supabase/server.ts
- Componentes reutilizáveis em src/components/
- Sempre incluir loading states e tratamento de erros
- O condomínio de teste tem ID: a0000000-0000-0000-0000-000000000001

## Regras de Negócio
- 1 voto por unidade (apartamento) por votação
- Moradores só veem dados do próprio condomínio
- Apenas síndicos acessam /dashboard
- Demandas só editáveis pelo autor enquanto status = 'aberta'

## Contexto
Leia SPEC.md para especificação completa e DATABASE.sql para o schema do banco.
