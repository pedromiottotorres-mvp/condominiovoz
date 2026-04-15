'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface Registro {
  mes: number
  ano: number
  receita_condominial: number
  custos_fixos: number
  saldo_investimento: number
}

interface Props {
  dados: Registro[]
}

function fmtK(value: number) {
  if (Math.abs(value) >= 1000) return `R$${(value / 1000).toFixed(1)}k`
  return `R$${value}`
}

export default function FinanceiroGrafico({ dados }: Props) {
  // Pegar últimos 6 meses e exibir em ordem cronológica
  const ultimos6 = [...dados].slice(0, 6).reverse().map((d) => ({
    name: `${MESES[d.mes - 1]}/${String(d.ano).slice(2)}`,
    Receita: d.receita_condominial,
    Custos: d.custos_fixos,
    Saldo: d.saldo_investimento,
  }))

  if (ultimos6.length === 0) return null

  return (
    <div style={{
      background: '#fff', borderRadius: '20px',
      border: '1px solid var(--gray-100)',
      boxShadow: '0 2px 12px rgba(15,36,64,0.06)',
      padding: '24px',
      marginTop: '24px',
    }}>
      <h2 style={{
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem',
        color: 'var(--navy)', marginBottom: '20px',
      }}>
        Evolução dos Últimos {ultimos6.length} Meses
      </h2>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={ultimos6} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: '#94a3b8' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tickFormatter={fmtK}
            tick={{ fontSize: 11, fontFamily: 'var(--font-body)', fill: '#94a3b8' }}
            axisLine={false} tickLine={false} width={52}
          />
          <Tooltip
            formatter={(value, name) => [
              Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              name as string,
            ]}
            contentStyle={{
              fontFamily: 'var(--font-body)', fontSize: '0.8rem',
              borderRadius: '10px', border: '1px solid var(--gray-100)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
            labelStyle={{ fontWeight: 700, color: 'var(--navy)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '0.8rem', fontFamily: 'var(--font-body)', paddingTop: '12px' }}
          />
          <Bar dataKey="Receita" fill="#1e3a5f" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Custos"  fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Saldo"   fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
