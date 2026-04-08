'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const CATEGORIA_CORES: Record<string, string> = {
  manutencao: '#eab308',
  seguranca: '#ef4444',
  lazer: '#22c55e',
  estetica: '#a855f7',
  estrutural: '#f97316',
  outro: '#9ca3af',
}

interface Item {
  titulo: string
  categoria: string
  total_apoios: number
}

interface Props {
  dados: Item[]
}

function truncar(s: string, max = 22) {
  return s.length > max ? s.slice(0, max) + '…' : s
}

export default function GraficoBarras({ dados }: Props) {
  const data = dados.map((d) => ({
    ...d,
    nome: truncar(d.titulo),
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 38)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={140}
          tick={{ fontSize: 11, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value ?? 0} apoios`, 'Apoios']}
          labelFormatter={(label) => label}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: 12,
          }}
        />
        <Bar dataKey="total_apoios" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={CATEGORIA_CORES[entry.categoria] ?? '#1e3a5f'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
