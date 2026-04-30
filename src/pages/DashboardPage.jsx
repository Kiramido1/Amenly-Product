import { lazy, Suspense, memo } from 'react'
import { DashboardProvider } from '../context/DashboardContext'
import ErrorBoundary from '../components/ErrorBoundary'
import Footer from '../components/Footer'

// Lazy load components with error handling
const DashboardHeader = lazy(() => import('../components/dashboard/DashboardHeader').catch(err => {
  console.error('Failed to load DashboardHeader:', err)
  return { default: () => <div className="h-14 bg-black/95" /> }
}))

const AIInsightBar = lazy(() => import('../components/dashboard/AIInsightBar').catch(err => {
  console.error('Failed to load AIInsightBar:', err)
  return { default: () => <div className="h-12 bg-black/40" /> }
}))

const StatsCards = lazy(() => import('../components/dashboard/StatsCards').catch(err => {
  console.error('Failed to load StatsCards:', err)
  return { default: () => <div className="h-32 bg-black/40" /> }
}))

const InfrastructureMap = lazy(() => import('../components/dashboard/InfrastructureMap').catch(err => {
  console.error('Failed to load InfrastructureMap:', err)
  return { default: () => <div className="h-96 bg-black/40 rounded-lg flex items-center justify-center text-white/50">Map unavailable</div> }
}))

const AssetDetailPanel = lazy(() => import('../components/dashboard/AssetDetailPanel').catch(err => {
  console.error('Failed to load AssetDetailPanel:', err)
  return { default: () => null }
}))

const ComplianceCharts = lazy(() => import('../components/dashboard/ComplianceCharts').catch(err => {
  console.error('Failed to load ComplianceCharts:', err)
  return { default: () => <div className="h-64 bg-black/40 rounded-lg" /> }
}))

const RegulationTracker = lazy(() => import('../components/dashboard/RegulationTracker').catch(err => {
  console.error('Failed to load RegulationTracker:', err)
  return { default: () => <div className="h-96 bg-black/40 rounded-lg" /> }
}))

// Optimized loading fallback - no animations
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center py-16">
    <div className="w-6 h-6 border-2 border-white/10 border-t-amenly-light/50 rounded-full animate-spin" />
  </div>
))

// Optimized skeleton - no animations
const SkeletonCards = memo(() => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[110px] rounded-xl bg-black/40 border border-white/10" />
      ))}
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[52px] rounded-xl bg-black/30 border border-white/10" />
      ))}
    </div>
  </div>
))

// Static background - no animations
const StaticBackground = memo(() => (
  <div className="fixed inset-0 pointer-events-none z-0">
    {/* Deep black base */}
    <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black" />
    
    {/* Static glows - no blur for performance */}
    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amenly-light/3 rounded-full" style={{ filter: 'blur(100px)' }} />
    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amenly-dark/3 rounded-full" style={{ filter: 'blur(80px)' }} />
    
    {/* Static grid pattern */}
    <div 
      className="absolute inset-0 opacity-[0.015]" 
      style={{ 
        backgroundImage: 'linear-gradient(rgba(44,116,179,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(44,116,179,0.5) 1px, transparent 1px)', 
        backgroundSize: '80px 80px' 
      }} 
    />
  </div>
))

const DashboardPage = () => {
  return (
    <DashboardProvider>
      <div className="min-h-screen flex flex-col bg-[#050505] relative overflow-hidden">
        {/* Static Background - no animations */}
        <StaticBackground />

        {/* Header */}
        <div className="relative z-20">
          <ErrorBoundary>
            <Suspense fallback={<div className="h-14 bg-black/95" />}>
              <DashboardHeader />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* AI Insight Bar */}
        <div className="relative z-20">
          <ErrorBoundary>
            <Suspense fallback={<div className="h-12 bg-black/40" />}>
              <AIInsightBar />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Content */}
        <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-chat">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<SkeletonCards />}>
                <StatsCards />
              </Suspense>
            </ErrorBoundary>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <InfrastructureMap />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <RegulationTracker />
                </Suspense>
              </ErrorBoundary>
            </div>

            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                <ComplianceCharts />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Footer */}
          <Footer />
        </main>

        <ErrorBoundary>
          <Suspense fallback={null}>
            <AssetDetailPanel />
          </Suspense>
        </ErrorBoundary>
      </div>
    </DashboardProvider>
  )
}

export default memo(DashboardPage)
