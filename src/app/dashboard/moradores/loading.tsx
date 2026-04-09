import { TabelaSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-4">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
      </header>
      <main className="px-4 md:px-8 py-6 max-w-3xl">
        <TabelaSkeleton />
      </main>
    </div>
  )
}
