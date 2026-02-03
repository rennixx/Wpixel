"use client";

import { useState } from "react";
import { RotateCcw, Menu, HelpCircle, X, Globe } from "lucide-react";

interface ToolbarProps {
  onResetView: () => void;
  onToggleSidebar: () => void;
  showSidebar: boolean;
}

export function Toolbar({ onResetView, onToggleSidebar, showSidebar }: ToolbarProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      {/* Top toolbar */}
      <header className="fixed top-0 left-0 right-0 z-30 p-4 flex items-center justify-between pointer-events-none">
        {/* Logo */}
        <div className="glass rounded-xl px-4 py-2 flex items-center gap-2 pointer-events-auto">
          <Globe className="text-neon-blue" size={24} />
          <h1 className="font-bold text-lg">
            Planet<span className="text-neon-blue">Canvas</span>
          </h1>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowHelp(true)}
            className="glass p-3 rounded-xl hover:bg-white/10 btn-hover"
            aria-label="How to use"
          >
            <HelpCircle size={20} />
          </button>
          <button
            onClick={onResetView}
            className="glass p-3 rounded-xl hover:bg-white/10 btn-hover"
            aria-label="Reset view"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={onToggleSidebar}
            className="glass p-3 rounded-xl hover:bg-white/10 btn-hover md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Help modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in">
          <div className="relative glass rounded-2xl p-6 max-w-md w-full mx-4">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <HelpCircle className="text-neon-blue" size={24} />
              How to Use
            </h2>

            <div className="space-y-4 text-white/80">
              <div className="flex gap-3">
                <span className="text-2xl">🌍</span>
                <div>
                  <h3 className="font-semibold">Navigate</h3>
                  <p className="text-sm text-white/60">
                    Click and drag to rotate the Earth. Scroll to zoom in/out.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold">Select Region</h3>
                  <p className="text-sm text-white/60">
                    Double-click on any location to open the drawing canvas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">🎨</span>
                <div>
                  <h3 className="font-semibold">Draw</h3>
                  <p className="text-sm text-white/60">
                    Use the brush tools to create your artwork. Pick any color!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="font-semibold">Enhance (Optional)</h3>
                  <p className="text-sm text-white/60">
                    Use AI to transform your drawing into different styles.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <h3 className="font-semibold">Stamp</h3>
                  <p className="text-sm text-white/60">
                    Your drawing is permanently added to the shared Earth!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-6 w-full py-3 rounded-xl bg-neon-blue/30 hover:bg-neon-blue/50 btn-hover"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
