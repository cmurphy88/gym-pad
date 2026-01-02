'use client'

import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Header from '@/components/Header'
import InsightsDashboard from '@/components/InsightsDashboard'
import { ArrowLeftIcon, TrendingUp, RefreshCw } from 'lucide-react'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function InsightsPage() {
  const router = useRouter()

  const { data, error, isLoading, mutate } = useSWR('/api/insights', fetcher)

  const handleBack = () => {
    router.push('/')
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
        <Header />
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load insights</p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                  <h1 className="text-3xl font-bold text-white">Training Insights</h1>
                </div>
                <p className="text-gray-400 mt-1">
                  Progression suggestions based on your RPE trends
                </p>
              </div>
            </div>

            <button
              onClick={() => mutate()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh insights"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-6">
              {/* Summary skeleton */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4 animate-pulse">
                    <div className="h-8 bg-gray-700 rounded mb-2 mx-auto w-12"></div>
                    <div className="h-3 bg-gray-700 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>

              {/* Categories skeleton */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-gray-700 rounded-xl overflow-hidden animate-pulse">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                      <div className="h-5 bg-gray-700 rounded w-32"></div>
                      <div className="h-4 bg-gray-700 rounded w-8"></div>
                    </div>
                    <div className="p-4 space-y-3">
                      {[1, 2].map((j) => (
                        <div key={j} className="h-12 bg-gray-800 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : data ? (
            <InsightsDashboard data={data} />
          ) : null}
        </div>
      </main>
    </div>
  )
}
