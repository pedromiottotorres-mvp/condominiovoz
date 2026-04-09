// Bloco base de skeleton
function Bloco({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-gray-200 rounded-lg animate-pulse ${className}`}
      style={style}
    />
  )
}

// Skeleton de um DemandaCard
export function DemandaCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <Bloco className="h-4 w-20 mb-3" />
      <Bloco className="h-4 w-full mb-2" />
      <Bloco className="h-3 w-2/3 mb-4" />
      <div className="flex items-center justify-between">
        <Bloco className="h-3 w-16" />
        <Bloco className="h-7 w-20 rounded-full" />
      </div>
    </div>
  )
}

// Skeleton de lista de demandas (com chips de filtro)
export function DemandasListSkeleton() {
  return (
    <div>
      {/* Chips */}
      <div className="flex gap-2 pb-1 -mx-4 px-4 overflow-hidden">
        {[80, 100, 80, 90, 80, 70, 60].map((w, i) => (
          <Bloco key={i} className="h-7 rounded-full flex-shrink-0" style={{ width: w }} />
        ))}
      </div>
      {/* Cards */}
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <DemandaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Skeleton de votação
export function VotacaoCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <Bloco className="h-5 w-16 rounded-full" />
        <Bloco className="h-3 w-14" />
      </div>
      <Bloco className="h-4 w-3/4 mb-2" />
      <Bloco className="h-3 w-1/2" />
    </div>
  )
}

// Skeleton de linha de tabela (moradores)
export function TabelaSkeleton({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <Bloco className="h-3 w-48" />
      </div>
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0">
          <Bloco className="h-4 w-40" />
          <Bloco className="h-4 w-12" />
          <Bloco className="h-5 w-16 rounded-full" />
          <Bloco className="h-3 w-24 ml-auto" />
        </div>
      ))}
    </div>
  )
}

// Skeleton de métricas do dashboard
export function MetricasSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
          <Bloco className="h-9 w-9 rounded-xl mb-3" />
          <Bloco className="h-7 w-16 mb-2" />
          <Bloco className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}
