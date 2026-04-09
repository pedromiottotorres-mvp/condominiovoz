import { DemandasListSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Header skeleton */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 pt-4">
        <DemandasListSkeleton />
      </main>
    </div>
  )
}
