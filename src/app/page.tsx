'use client'

import dynamic from 'next/dynamic'

// Dynamically import Globe3D to avoid SSR issues with Three.js
const Globe3D = dynamic(() => import('@/components/Globe3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-space-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-neon-cyan text-lg">Loading PlanetCanvas 3D...</p>
      </div>
    </div>
  ),
})

export default function Home() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              PlanetCanvas<span className="text-neon-cyan">3D</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1">Draw on Earth, Share with the World</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-300">Click anywhere on the globe to start drawing</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3D Globe */}
      <Globe3D />

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="text-center text-gray-500 text-xs">
          <p>Use mouse to rotate • Scroll to zoom • Click to draw</p>
        </div>
      </footer>
    </main>
  )
}
