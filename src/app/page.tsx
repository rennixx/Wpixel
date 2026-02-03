"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Toolbar } from "@/components/Toolbar";
import { SidebarFeed } from "@/components/SidebarFeed";
import { DrawCanvas } from "@/components/DrawCanvas";
import { AIEnhanceButton } from "@/components/AIEnhanceButton";
import type { Region, Stamp } from "@/lib/types/drawing";

// Dynamic import for Globe3D to avoid SSR issues with Three.js
const Globe3D = dynamic(() => import("@/components/Globe3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60">Loading Earth...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pendingDrawing, setPendingDrawing] = useState<Blob | null>(null);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);

  const handleRegionClick = useCallback((lat: number, long: number, zoom: number) => {
    setSelectedRegion({ lat, long, zoom });
    setIsDrawingMode(true);
  }, []);

  const handleDrawingComplete = useCallback((imageBlob: Blob) => {
    setPendingDrawing(imageBlob);
    setShowEnhanceModal(true);
  }, []);

  const handleDrawingCancel = useCallback(() => {
    setIsDrawingMode(false);
    setSelectedRegion(null);
  }, []);

  const handleEnhanceComplete = useCallback(async (enhancedBlob: Blob | null) => {
    const finalBlob = enhancedBlob || pendingDrawing;
    if (!finalBlob || !selectedRegion) return;

    // Convert blob to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      try {
        const response = await fetch("/api/stamp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            lat: selectedRegion.lat,
            long: selectedRegion.long,
            zoom: selectedRegion.zoom,
            userId: getOrCreateUserId(),
          }),
        });

        if (response.ok) {
          console.log("Stamp successful!");
        }
      } catch (error) {
        console.error("Failed to stamp:", error);
      }
    };
    reader.readAsDataURL(finalBlob);

    // Reset state
    setShowEnhanceModal(false);
    setPendingDrawing(null);
    setIsDrawingMode(false);
    setSelectedRegion(null);
  }, [pendingDrawing, selectedRegion]);

  const handleSkipEnhance = useCallback(() => {
    handleEnhanceComplete(null);
  }, [handleEnhanceComplete]);

  const handleActivityClick = useCallback((stamp: Stamp) => {
    // This will be used to fly the camera to the stamp location
    setSelectedRegion({ lat: stamp.lat, long: stamp.long, zoom: stamp.zoom });
  }, []);

  const handleResetView = useCallback(() => {
    setSelectedRegion(null);
    setIsDrawingMode(false);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-background">
      {/* 3D Globe */}
      <div className="absolute inset-0">
        <Globe3D
          onRegionClick={handleRegionClick}
          selectedRegion={selectedRegion}
          isDrawingMode={isDrawingMode}
        />
      </div>

      {/* Top Toolbar */}
      <Toolbar
        onResetView={handleResetView}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showSidebar={showSidebar}
      />

      {/* Activity Feed Sidebar */}
      <SidebarFeed
        isVisible={showSidebar}
        onActivityClick={handleActivityClick}
        onClose={() => setShowSidebar(false)}
      />

      {/* Drawing Canvas Overlay */}
      {isDrawingMode && selectedRegion && (
        <DrawCanvas
          isVisible={isDrawingMode}
          region={selectedRegion}
          onComplete={handleDrawingComplete}
          onCancel={handleDrawingCancel}
        />
      )}

      {/* AI Enhancement Modal */}
      {showEnhanceModal && pendingDrawing && (
        <AIEnhanceButton
          originalImage={pendingDrawing}
          onEnhanced={(enhancedBlob) => handleEnhanceComplete(enhancedBlob)}
          onSkip={handleSkipEnhance}
          onClose={() => {
            setShowEnhanceModal(false);
            setPendingDrawing(null);
          }}
        />
      )}

      {/* Coordinates Display */}
      {selectedRegion && !isDrawingMode && (
        <div className="absolute bottom-4 left-4 glass rounded-lg px-4 py-2 text-sm text-white/80">
          <span className="text-neon-blue">📍</span>{" "}
          {selectedRegion.lat.toFixed(4)}°, {selectedRegion.long.toFixed(4)}°
        </div>
      )}
    </main>
  );
}

// Helper function to get or create anonymous user ID
function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  
  let userId = localStorage.getItem("planetcanvas_user_id");
  if (!userId) {
    userId = `user_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("planetcanvas_user_id", userId);
  }
  return userId;
}
