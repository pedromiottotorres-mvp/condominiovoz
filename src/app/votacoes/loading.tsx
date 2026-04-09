import { VotacaoCardSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pt-5 flex flex-col gap-6">
        {['Abertas', 'Encerradas'].map((secao) => (
          <section key={secao}>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <VotacaoCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
