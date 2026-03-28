export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="h-9 w-64 bg-gray-800 rounded-lg mb-2" />
          <div className="h-4 w-40 bg-gray-800 rounded" />
        </div>
        <div className="h-9 w-32 bg-gray-800 rounded-lg" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-24" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-20" />
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-20" />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-8 h-24" />

      <div className="h-7 w-48 bg-gray-800 rounded mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-28" />
        ))}
      </div>
    </div>
  )
}
