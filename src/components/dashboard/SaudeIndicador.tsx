interface Props {
  score: number // 0-100
}

export default function SaudeIndicador({ score }: Props) {
  const size = 140
  const stroke = 14
  const radius = (size - stroke) / 2
  const circunferencia = 2 * Math.PI * radius
  const preenchimento = (score / 100) * circunferencia
  const offset = circunferencia - preenchimento

  const cor =
    score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label =
    score >= 70 ? 'Ótimo' : score >= 40 ? 'Regular' : 'Crítico'

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} aria-label={`Saúde: ${score}/100`}>
        {/* Trilha */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={stroke}
        />
        {/* Progresso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={cor}
          strokeWidth={stroke}
          strokeDasharray={`${preenchimento} ${circunferencia - preenchimento}`}
          strokeDashoffset={circunferencia / 4} /* começa do topo */
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Score */}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={28}
          fontWeight={700}
          fill={cor}
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fill="#9ca3af"
        >
          / 100
        </text>
      </svg>

      <div className="text-center">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: cor + '1a', color: cor }}
        >
          {label}
        </span>
        <p className="text-xs text-gray-400 mt-1">
          Demandas concluídas / total
        </p>
      </div>
    </div>
  )
}
