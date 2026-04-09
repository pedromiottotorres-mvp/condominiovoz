import { MetricasSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4">
        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
      </header>
      <main className="px-4 md:px-8 py-6 flex flex-col gap-6 max-w-4xl">
        <MetricasSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl border border-gray-100 p-5 ${i === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
