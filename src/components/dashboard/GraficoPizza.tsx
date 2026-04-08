'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
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

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao: 'Manutenção',
  seguranca: 'Segurança',
  lazer: 'Lazer',
  estetica: 'Estética',
  estrutural: 'Estrutural',
  outro: 'Outro',
}

interface Item {
  categoria: string
  total: number
}

interface Props {
  dados: Item[]
}

export default function GraficoPizza({ dados }: Props) {
  const data = dados.map((d) => ({
    name: CATEGORIA_LABELS[d.categoria] ?? d.categoria,
    value: d.total,
    categoria: d.categoria,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          outerRadius={85}
          innerRadius={40}
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell
              key={`cell-${i}`}
              fill={CATEGORIA_CORES[entry.categoria] ?? '#9ca3af'}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value ?? 0} demandas`, name]}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
